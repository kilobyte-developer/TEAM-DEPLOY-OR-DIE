# Source Code Gemini Upgrade Report

## Root Cause

User story generation already had an LLM provider chain:

OpenAI -> Gemini -> Local

Source-code generation did not. `/api/generate-tests` called `backend/mvp_engine.py generate-tests` directly, so Python uploads always used the local deterministic engine.

## Fix

Source-code generation now adds a Gemini-first upgrade path when `GEMINI_SOURCE_CODE_TESTS_API_KEY` is configured.

The route still runs the local engine first to preserve the existing AST analysis, file paths, manifest shape, and safe fallback payload. If Gemini returns valid semantic suites and executable pytest code, Gemini output replaces the local test payload and is written to the same generated artifact paths.

## Architecture

Source-code upload flow:

1. Upload Python file.
2. Analyze source code.
3. Generate local baseline for compatibility and fallback.
4. Call Gemini with `GEMINI_SOURCE_CODE_TESTS_API_KEY`.
5. Validate strict JSON response.
6. Write Gemini unit, edge, combined test artifacts.
7. Enrich logic issues with AI fix suggestions.
8. Store generated tests and logic issues in Supabase.
9. Existing execution and coverage routes consume the same manifest and artifact paths.

## Provider Flow

Source code tests:

Gemini Source Code Key -> Generate Semantic Tests -> Generate Executable Tests -> Local Engine fallback

User stories:

Unchanged.

Existing OpenAI -> Gemini -> Local behavior remains locked in `/api/generate-userstory-tests`.

## Validation Results

Static validation completed:

- TypeScript compile via `pnpm exec tsc --noEmit`.
- Representative local fallback generation via `backend/mvp_engine.py` for:
  - `buggy_even_checker.py`
  - `discount_calculator.py`
  - `bank_account.py`
  - `loan_management_system.py`

Runtime Gemini validation requires real keys in `.env`:

- `GEMINI_SOURCE_CODE_TESTS_API_KEY`
- `GEMINI_AI_FIXATIONS_API_KEY`

## Fallback Logic

If Gemini is unavailable, missing, or returns invalid JSON/code:

- Existing local deterministic source-code generation is used.
- Execution still runs.
- Coverage still runs.
- Supabase storage still runs.
- UI displays generated local tests.

If fix suggestion Gemini is unavailable:

- Potential logic issue remains visible.
- UI displays `AI Fix Suggestion Unavailable`.
- No generation or execution flow is blocked.
