# HACKATHON PREP — TESTGENAI (Updated, Source of Truth)

> **This document supersedes all other files in `project-reports/`.  
> The older docs (`CODE_UNDERSTANDING_README.md`, `FINAL_DELIVERABLES_REPORT.md`, etc.)
> describe an earlier state of the codebase and contain inaccuracies about the AI layer.
> Use THIS file when talking to judges.**

---

## What the Outdated Docs Got Wrong (Don't Say These Things)

| What the Old Docs Say | What the Code Actually Does Now |
|---|---|
| "Source-code generation is **deterministic only** — no LLM used" | ❌ Wrong. `app/api/generate-tests/route.ts` now calls **Gemini 2.5 Flash Lite** to enrich the local baseline, then makes a *second* Gemini call per logic issue to generate AI fix suggestions |
| "Gemini is a **fallback only in user-story mode**" | ❌ Wrong. Gemini is now the **primary enhancement layer for source-code mode** too |
| "FastAPI handles only `/coverage` and `/health`" | Partially wrong — FastAPI also exposes `/upload`, `/analyze`, `/generate-tests`, `/run-tests` (used when deployed remotely to Render) |

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                  Next.js 14 Frontend (app/)                 │
│  React Context (testgenai-provider.tsx)                     │
│  ↕  fetch to /api/* (Next.js API Routes)                    │
└──────────────┬──────────────────────────┬───────────────────┘
               │  Local Dev               │  Remote (Vercel → Render)
               ▼                          ▼
┌──────────────────────┐     ┌───────────────────────────┐
│  Next.js API Routes  │     │  FastAPI Backend          │
│  app/api/**/route.ts │──── │  backend/main.py          │
└──────────┬───────────┘     └────────────┬──────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐     ┌───────────────────────────┐
│  mvp_engine.py       │     │  mvp_engine.py (spawned)  │
│  (AST + Semantic)    │     │  (via subprocess)         │
└──────────┬───────────┘     └────────────┬──────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐     ┌───────────────────────────┐
│  Gemini API          │     │  Supabase (PostgreSQL)    │
│  (gemini-2.5-flash)  │     │  database_service.py      │
└──────────────────────┘     └───────────────────────────┘
```

---

## The 3 Most Important Files

---

### 1. `backend/mvp_engine.py` — The Core Engine (1,460 lines)

The offline heart of the system. Parses Python source using Python's `ast` module, extracts every function and class, then runs each function through a **priority chain of intent inferrers** that generate test cases based on *what the function name says it should do*, not what the implementation actually does.

If intent contradicts implementation (e.g. `is_even` using `n % 2 == 1`), it attaches a `potentialLogicIssue` with high confidence. `build_semantic_assertion_tests()` converts deterministic cases into runnable `pytest` assertions. `build_unit_tests()` and `build_edge_tests()` add structural and TypeError-boundary tests. Entirely offline — no API calls.

**Key functions:**

| Function | What It Does |
|---|---|
| `analyze_python_source()` | AST walk: extracts functions, classes, params, types, docstrings, imports |
| `build_semantic_test_suites()` | Dispatch chain: tries each `infer_*_intent_cases()` in order, falls back to `build_generic_semantic_cases()` |
| `infer_even_odd_intent_cases()` | Detects inverted modulo operator; generates even/odd/zero/negative test cases |
| `infer_discount_intent_cases()` | Detects if discount function increases price; generates price-reduction test cases |
| `infer_prime_intent_cases()` | Flags if function always returns `True`; generates prime/composite/boundary cases |
| `infer_withdraw_intent_cases()` | Balance vs amount logic; overdraft and exact-balance edge cases |
| `infer_authenticate_intent_cases()` | Valid/invalid credentials, empty input, case-sensitive password |
| `infer_interest_intent_cases()` | Detects raw principal return instead of computed interest |
| `build_unit_tests()` | Module imports, function callable, smoke-call for zero-arg functions |
| `build_edge_tests()` | Missing args → TypeError, unexpected args → TypeError |
| `build_semantic_assertion_tests()` | Converts safe semantic cases into executable pytest `assert` statements |
| `generate_tests_for_file()` | Top-level orchestrator: writes all .py files + manifest.json |

**The intent priority chain (line ~1287):**
```python
cases = (
    infer_even_odd_intent_cases(node, function)
    or infer_discount_intent_cases(node, function)
    or infer_prime_intent_cases(node, function)
    or infer_withdraw_intent_cases(node, function)
    or infer_divide_intent_cases(node, function)
    or infer_authenticate_intent_cases(node, function)
    or infer_interest_intent_cases(node, function)
    or infer_loan_approval_intent_cases(node, function)
    or infer_modulo_boolean_cases(node, function)
    or build_generic_semantic_cases(node, function)   # ← always fires
)
```
First matching intent wins. Fast, deterministic, offline.

---

### 2. `app/api/generate-tests/route.ts` — AI Orchestration (Most Changed from Docs, 389 lines)

The Next.js route that orchestrates the **full source-code generation pipeline**, including both LLM layers. This is where Gemini is used for source-code mode — something the old docs claimed didn't exist.

**Flow:**
1. Runs `mvp_engine.py` as subprocess → gets deterministic **baseline**
2. `tryGenerateWithGemini()` → sends full source + baseline to Gemini → enriched semantic suites + better pytest code
3. `enrichFixSuggestions()` → per-issue Gemini call → `{ currentCode, suggestedCode, explanation, confidence, severity }`
4. `preserveBaselineSemanticAssertions()` → re-injects any executable tests Gemini dropped
5. Writes artifacts to disk, records to Supabase, returns payload

**Key functions:**

| Function | What It Does |
|---|---|
| `buildGeminiSourcePrompt()` | Embeds source code + baseline analysis + import harness; instructs Gemini to return strict JSON |
| `tryGenerateWithGemini()` | Attempts Gemini enhancement; returns baseline unchanged on any error |
| `callGemini()` | Raw Gemini API call: `temperature: 0.2`, `responseMimeType: 'application/json'` |
| `normalizeGeminiSourcePayload()` | Validates Gemini JSON; throws if semantic suites or pytest functions are missing |
| `enrichFixSuggestions()` | Loops through logic issues; calls Gemini once per issue for a precise code fix |
| `buildFixPrompt()` | Per-issue prompt: sends function code + issue message → gets fix suggestion |
| `preserveBaselineSemanticAssertions()` | Prevents Gemini from silently dropping already-working assertions |

**Three-layer fallback:**
```
mvp_engine (deterministic, always works)
    ↓ baseline
Gemini enrichment (may fail → baseline returned unchanged)
    ↓
AI Fix per issue (may fail → { status: 'unavailable' } returned)
```

---

### 3. `app/api/generate-userstory-tests/route.ts` — User Story → Test Cases (647 lines)

Takes plain-English user stories / acceptance criteria and generates structured positive, negative, and edge test cases. Tries **OpenAI → Gemini → local rule engine** in order (order configurable via `LLM_PROVIDER_PRIORITY` env var).

The local rule engine is the standout: `parseCriterion()` classifies natural-language criteria into ~14 fintech-domain categories, and `positiveScenario()` / `negativeScenario()` / `boundaryScenario()` generate concrete test steps with real ₹ amounts, OTP windows, credit score thresholds, and daily limits. **Works with zero API keys.**

**Key functions:**

| Function | What It Does |
|---|---|
| `extractAcceptanceCriteria()` | Splits on "Acceptance Criteria:" or sentence boundaries |
| `parseCriterion()` | Classifies rule into: `otp-threshold`, `daily-limit`, `balance`, `range`, `minimum`, `maximum`, `document-required`, `duplicate-window`, `outcome`, `generic-required`, etc. |
| `positiveScenario()` / `negativeScenario()` / `boundaryScenario()` | Generate concrete steps and expected results per category |
| `generateWithProviders()` | Provider waterfall: OpenAI → Gemini → `localGenerateUserStoryTests()` |
| `buildPrompt()` | LLM system prompt mirroring the semantic intent rules |

---

## End-to-End Data Flow Trace (Source Code Mode)

```
[1] User drags file.py onto upload zone
      → uploadFilesAction() in testgenai-provider.tsx
      → fetch POST /api/upload (FormData)
      → file saved to /tmp/testgenai_uploads/file.py
      → Supabase: uploaded_files record inserted

[2] User clicks "Generate Tests"
      → generateSourceCodeTestsAction() in testgenai-provider.tsx
      → fetch POST /api/generate-tests { file_name: "file.py" }

[3] app/api/generate-tests/route.ts (local path):
      spawnSync(python, mvp_engine.py, "generate-tests", filePath, outputDir)

[4]   Inside mvp_engine.py:
        analyze_python_source(source_code, file_name)
          └─ ast.parse() → walk functions, classes, imports
        build_semantic_test_suites(source_code, file_path)
          └─ for each function → infer_*_intent_cases() priority chain
          └─ attaches potentialLogicIssues where intent ≠ implementation
        build_unit_tests(source_code, file_path, semantic_suites)
          └─ structural tests + build_semantic_assertion_tests()
        build_edge_tests(source_code, file_path)
          └─ TypeError boundary tests
        → writes test_{name}_unit.py, test_{name}_edge.py, manifest.json
        → prints JSON payload to stdout

[5]   tryGenerateWithGemini(filePath, baselinePayload)
        buildGeminiSourcePrompt(sourceCode, baseline)
          └─ embeds: source + semanticSuites + existing import harness
        POST https://generativelanguage.googleapis.com/v1beta/models/
             gemini-2.5-flash-lite:generateContent
          └─ temperature: 0.2, responseMimeType: 'application/json'
        normalizeGeminiSourcePayload(response, baseline)
          └─ validates semanticSuites present
          └─ preserveBaselineSemanticAssertions() re-injects dropped tests
        → returns enriched GeneratedTests

[6]   enrichFixSuggestions(sourceCode, geminiPayload)
        for each suite.potentialLogicIssues:
          buildFixPrompt(sourceCode, suite, issue)
          callGemini(apiKey, fixPrompt, AI_FIX_MODEL)
          normalizeFixSuggestion(response)
          → issue gets { currentCode, suggestedCode, explanation, severity }

[7]   writeGeneratedArtifacts() → overwrites .py files + manifest with AI-enhanced versions
      testgenaiDatabase.recordGeneratedTests() → Supabase
      return NextResponse.json(payload)

[8] testgenai-provider.tsx: TESTS_SUCCESS dispatch
      → UI shows semantic suites, pytest code, logic issues + fix suggestions

[9] User clicks "Run Tests"
      → fetch POST /api/run-tests { mode: 'source-code' }
      → reads manifest.json → spawnSync(python -m pytest unit.py edge.py -v --tb=short)
      → parse stdout: collected N, M passed, K failed
      → return ExecutionResultResponse { logs, passRate, executionTime }
      → Supabase: executions record inserted

[10] User clicks "Get Coverage" (calls FastAPI directly)
      → fetch GET {FASTAPI_URL}/coverage
      → backend/main.py spawns: pytest --cov={module} --cov-report=json
      → resolve_source_coverage_entry() maps coverage.json to source file
      → summarize_function_coverage() maps missing lines to function names
      → return CoverageResponse { coveragePercent, functionsCovered, missingFunctions }
      → Supabase: coverage_reports record inserted
```

---

## Supporting Files Quick Reference

| File | Role |
|---|---|
| `backend/main.py` | FastAPI server: `/upload`, `/analyze`, `/generate-tests`, `/run-tests`, `/coverage`, `/download-tests` |
| `backend/database_service.py` | Supabase persistence via stdlib `urllib` (no SDK). Gracefully no-ops if env vars missing. `refresh_metrics()` recomputes aggregate KPIs after every write |
| `backend/prompts/generate_test_cases.md` | 22-line system prompt defining the intent priority hierarchy (function name > docstring > params > implementation) |
| `components/testgenai-provider.tsx` | Global React state via `useReducer`. Every workflow action lives here. Uses `AsyncSlice<T>` pattern for loading/error/data per step |
| `lib/services/testgenai.ts` | All `fetch()` calls from frontend, typed. Most go to `/api/*` (Next.js); `getCoverage()` calls FastAPI directly |
| `lib/testgenai-types.ts` | Shared TypeScript contracts: `AnalysisResult`, `GeneratedTests`, `SemanticFunctionTestSuite`, `PotentialLogicIssue`, `ExecutionResult`, `CoverageReport`, `AnalyticsDashboardData` |
| `components/views/past-records-view.tsx` | Full history browser reading from Supabase; per-record details, semantic test viewer |
| `components/views/analytics-dashboard-view.tsx` | KPI dashboard: pass/fail pie, coverage trend, provider usage charts |
| `lib/report/html-report.ts` | Client-side HTML report builder; no backend needed for download |

---

## Key Environment Variables

| Variable | Used In | Purpose |
|---|---|---|
| `GEMINI_SOURCE_CODE_TESTS_API_KEY` | `generate-tests/route.ts` | Gemini enrichment for source-code test generation |
| `GEMINI_AI_FIXATIONS_API_KEY` | `generate-tests/route.ts` | Gemini per-issue fix suggestions |
| `GEMINI_API_KEY` | `generate-userstory-tests/route.ts` | Gemini for user story test gen |
| `OPENAI_API_KEY` | `generate-userstory-tests/route.ts` | OpenAI (primary for user stories) |
| `LLM_PROVIDER_PRIORITY` | `generate-userstory-tests/route.ts` | `"openai"` or `"gemini"` — sets waterfall order |
| `SUPABASE_URL` | `database_service.py` + `database/` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `database_service.py` + `database/` | Supabase auth key |
| `NEXT_PUBLIC_FASTAPI_URL` | `lib/services/testgenai.ts` | FastAPI URL (defaults to Render deployment) |

---

## Clever Design Decisions Worth Highlighting to Judges

### 1. Intent-First Testing
Tests are generated from **what the function is supposed to do**, not what it does. Priority: `function name > docstring > parameter names > implementation`. A broken `is_even` still gets tests expecting `True` for even numbers — the bug is flagged separately.

### 2. AST-Level Bug Detection Without Any LLM
`mvp_engine.py` statically inspects the AST to detect inverted modulo, discount-that-increases, auth-always-True, interest-returns-principal — all with zero API calls, zero latency.

### 3. Three-Layer AI with Silent Fallback at Every Level
`mvp_engine` (offline) → Gemini enrichment → AI fix suggestions. Each layer silently falls back to the previous if it fails. The app always returns a usable result.

### 4. `preserveBaselineSemanticAssertions()` — AI Safety Net
After Gemini rewrites test code, the system scans for any `def test_*_semantic_behavior()` functions from the baseline that were dropped. They're re-injected verbatim. AI cannot silently regress working tests.

### 5. Zero External Dependencies for DB
`database_service.py` uses Python's `urllib.request` — no Supabase SDK, no version conflicts. Graceful no-op when env vars are missing.

### 6. Local Fintech Rule Engine Works with Zero API Keys
The user story parser understands OTP thresholds, ₹ amounts, credit scores, daily limits, duplicate windows — no AI needed. Always returns usable test cases.

---

## One-Sentence Elevator Pitch

> **TestGenAI takes a Python file and — in seconds — generates a full pytest test suite that tests what the code is supposed to do, catches logic bugs that the implementation hides, and provides AI-generated fix suggestions with the exact line to change.**
