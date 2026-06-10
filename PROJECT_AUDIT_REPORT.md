# PROJECT AUDIT REPORT

Audit date: 2026-06-10, 0945HRS

## Executive Summary

TestGenAI currently has a strong frontend shell and a partially implemented backend, but the real product pipeline is not connected. The app is operating in demo mode end to end:

- The frontend service layer is 100% mocked via `window.setTimeout` and demo fixtures in `lib/mock-data.ts`.
- The global provider bootstraps pre-generated files, analysis, tests, execution logs, coverage, and evaluation results on app load.
- The Next.js API routes and FastAPI backend exist, but the frontend does not call either of them.
- Several API contracts do not match the frontend state/types, so the app would still not work if the mock layer were removed today.

Brutally honest status:

- Overall completion: 43%
- Frontend completion: 72%
- Backend completion: 46%
- Integration completion: 12%
- Demo readiness: 40/100

The repo is screenshot-ready, but not hackathon-MVP-ready as a real working system.

## 1. Project Architecture Overview

### Current architecture

Frontend:

- Next.js App Router pages under `app/`
- Shared global state in `components/testgenai-provider.tsx`
- Feature views under `components/views/`
- Feature panels under `components/testgenai/`
- Shared types in `lib/testgenai-types.ts`
- Service layer in `lib/services/testgenai.ts`

Backend surfaces:

- Next.js route handlers under `app/api/*`
- Separate FastAPI app in `backend/main.py`

### Actual runtime data flow today

1. User opens the app.
2. `app/layout.tsx` mounts `TestGenAIProvider`.
3. `TestGenAIProvider` immediately calls `getDemoWorkspace()` and `getEvaluationResults()` from `lib/services/testgenai.ts`.
4. Those functions return cloned mock data from `lib/mock-data.ts`.
5. All pages render from that in-memory mock state.
6. Upload, analyze, generate, run, and coverage actions all call mocked service functions, not real APIs.

### Intended architecture, but not implemented

Intended path appears to be:

1. Upload source file(s) to `POST /api/upload`
2. Analyze uploaded code via `POST /api/analyze`
3. Generate tests via `POST /api/generate-tests`
4. Execute tests via FastAPI `POST /run-tests`
5. Pull coverage via FastAPI `GET /coverage`
6. Read aggregate results from `GET /api/results`
7. Download generated tests via `GET /api/download-tests`

That pipeline is not wired together in the current codebase.

### Key architectural finding

This repo contains two disconnected systems:

- A polished frontend demo system
- A partially implemented backend prototype

There is no working orchestration layer between them.

## 2. Frontend Status

### What is implemented well

- App shell and routing are present:
  - `/`
  - `/upload`
  - `/generate`
  - `/execution`
  - `/results`
  - `/metrics`
- The frontend is well organized into:
  - page wrappers in `app/*/page.tsx`
  - view containers in `components/views/*`
  - reusable workflow panels in `components/testgenai/*`
- UI coverage is strong:
  - upload workflow
  - user story input
  - analysis panel
  - test viewer
  - user story test viewer
  - execution center
  - log viewer
  - coverage panel
  - evaluation panel
  - dashboard
  - workflow visualization
- Loading, empty, and error state components exist for most panels.
- The visual system is coherent and hackathon-demo-friendly.

### What is not actually implemented

- No real API calls exist in the frontend service layer.
- No real file content is retained in frontend state after upload.
- No real execution log streaming exists.
- No download-tests button exists in the UI.
- No real evaluation API exists.
- No repository upload flow exists.
- No real AST analysis exists.

### Important frontend evidence

- `components/testgenai-provider.tsx:352-385`
  - Bootstraps demo workspace on mount.
- `lib/services/testgenai.ts:87-147`
  - Uses `simulate()` with `window.setTimeout`.
- `components/testgenai/code-upload-panel.tsx:81`
  - Literal text says upload is preparing a future `POST /upload` integration.
- `components/testgenai/demo-badge.tsx:3-7`
  - UI explicitly shows `Demo Mode Active`.

### Frontend verdict

The frontend is mostly complete as a demo interface, but not as a real working product frontend.

## 3. Backend Status

### Next.js API routes present

- `POST /api/upload`
- `POST /api/analyze`
- `POST /api/generate-tests`
- `POST /api/generate-userstory-tests`
- `GET /api/results`
- `GET /api/download-tests`

### FastAPI routes present

- `POST /run-tests`
- `GET /coverage`
- `GET /health`

### Backend strengths

- Route structure exists.
- Filesystem directories are accounted for:
  - `backend/uploads`
  - `backend/generated_tests`
  - `backend/reports`
- Basic validation exists on several routes.
- FastAPI file execution and report writing are partially implemented.

### Backend weaknesses

- No actual AST parser is implemented anywhere.
- Analysis is LLM-based prompt extraction, not AST-based extraction.
- Python is the only real backend language path implemented.
- Upload route only accepts `.py`, while frontend advertises many languages.
- Test generation route accepts a raw `source_code` string only.
- User story generation route returns a flat string array, not the structured suite the frontend expects.
- Execution route requires `test_code`, but the frontend never stores real test code from a backend call.
- Coverage route measures `backend/generated_tests`, which is the generated test file location, not the uploaded source under test.
- Coverage metric names are misleading: it derives line counts, then labels them as functions.
- CORS is hardcoded to `http://localhost:3000`.
- No env example or deployment config exists.

### Verification notes

- `python -m py_compile backend\main.py` passed.
- At audit time, `backend/uploads`, `backend/generated_tests`, and `backend/reports` were empty.

### Backend verdict

The backend is a prototype, not a finished service.

## 4. State Management Status

### Current design

State is centralized in a single React context + reducer:

- File upload state
- Selected file
- User story input
- Analysis result
- Generated tests
- User story tests
- Execution result
- Coverage result
- Evaluation records
- Activity feed

### What is good

- Single source of truth
- Clear async slice pattern
- Good UI reactivity
- Clean derived stats calculation

### What is risky

- State is initialized from demo data, not from real backend state.
- Uploaded source metadata is stored, but file contents are not.
- `demoMode` exists in state but is never read anywhere after initialization.
- `uploadError` is tracked in state but not rendered in the UI.
- `SET_EVALUATION_RESULTS` exists in the reducer but is never dispatched.

### State verdict

The reducer structure is solid, but it currently manages a simulation, not a live workflow.

## 5. API Integration Status

### Actual integration status

Frontend to backend integration is effectively absent.

Evidence:

- `components/testgenai-provider.tsx` is the only consumer of `lib/services/testgenai.ts`.
- `lib/services/testgenai.ts` contains no `fetch()` or HTTP client calls.
- Search audit found no frontend calls to:
  - `/api/upload`
  - `/api/analyze`
  - `/api/generate-tests`
  - `/api/generate-userstory-tests`
  - `/api/results`
  - `/api/download-tests`
  - `http://localhost:8000/run-tests`
  - `http://localhost:8000/coverage`

### Contract mismatches

#### Upload mismatch

Frontend expects:

- `UploadedSourceFile[]`
- multiple files
- rich metadata

Backend returns:

- single-file response
- `{ file_name, file_size, status }`

Files involved:

- `components/testgenai-provider.tsx:406-443`
- `lib/testgenai-types.ts:15-25`
- `app/api/upload/route.ts:7-44`

#### Analysis mismatch

Frontend expects:

- repository
- generatedAt
- function ids
- parameter objects
- return types
- dependencies
- descriptions
- class metadata with methods

Backend returns:

- `{ functions: [{name, parameters: string[]}], classes: string[], imports: string[] }`

Files involved:

- `lib/testgenai-types.ts:27-57`
- `app/api/analyze/route.ts:8-21`

#### Test generation mismatch

Frontend expects:

- separate unit and edge-case artifacts
- filenames
- summary counts
- display-ready code artifacts

Backend returns:

- `{ generated_tests: string }`

Files involved:

- `lib/testgenai-types.ts:59-78`
- `app/api/generate-tests/route.ts:8-15`

#### User story generation mismatch

Frontend expects:

- positive cases
- negative cases
- edge cases
- structured steps
- expected results
- priority

Backend returns:

- `{ test_cases: string[] }`

Files involved:

- `lib/testgenai-types.ts:80-96`
- `app/api/generate-userstory-tests/route.ts:4-10`

#### Execution mismatch

Frontend expects:

- mode
- status
- total tests
- passed
- failed
- execution time
- pass rate
- logs

FastAPI returns:

- `{ passed, failed, status }`

Files involved:

- `lib/testgenai-types.ts:98-114`
- `backend/main.py:39-47`

#### Coverage mismatch

Frontend expects:

- total coverage percent
- functions covered
- missing function names
- edge-case counts
- summary text
- file-by-file breakdown

FastAPI returns:

- `{ coverage, functions_covered, functions_missing }`

Files involved:

- `lib/testgenai-types.ts:116-131`
- `backend/main.py:49-53`

### API integration verdict

The integration layer is not just incomplete. Its request and response contracts are fundamentally misaligned.

## 6. Mock Data Usage Report

### Mocking is currently systemic

The frontend is fully powered by mock data:

- `DEMO_MODE_ENABLED = true` in `lib/mock-data.ts:12`
- `getDemoWorkspace()` returns analysis, generated tests, execution, coverage, activity, and uploaded files
- `getEvaluationResults()` returns demo evaluation metrics
- `uploadFile()`, `analyzeCode()`, `generateTests()`, `generateUserStoryTests()`, `runTests()`, and `getCoverage()` all simulate async responses

### Mocked assets in use

- uploaded files
- analysis result
- generated unit tests
- generated edge tests
- user story test suite
- execution logs
- coverage report
- evaluation metrics
- activity feed

### Impact

This means:

- judges can be shown convincing UI output without any backend activity
- frontend/backend connectivity cannot be inferred from the UI alone
- current pass/fail and coverage numbers are not evidence of a working system

## 7. Dead Code Report

### Confirmed dead or orphaned items

1. `demoMode` state field
   - Defined in `lib/testgenai-types.ts:168`
   - Set in `components/testgenai-provider.tsx:45`
   - Never read anywhere

2. `SET_EVALUATION_RESULTS` reducer action
   - Defined in `components/testgenai-provider.tsx:85`
   - Implemented in reducer at `components/testgenai-provider.tsx:277-281`
   - Never dispatched

3. `uploadError` state
   - Defined and updated in provider
   - Not rendered anywhere in the UI

4. Orphaned backend endpoints from frontend perspective
   - `/api/upload`
   - `/api/analyze`
   - `/api/generate-tests`
   - `/api/generate-userstory-tests`
   - `/api/results`
   - `/api/download-tests`
   - FastAPI `/run-tests`
   - FastAPI `/coverage`

5. Empty runtime folders at audit time
   - `backend/uploads`
   - `backend/generated_tests`
   - `backend/reports`

These are not dead files in the strict compiler sense, but they are dead from the product execution path.

## 8. Unused Components Report

### Feature components

The main feature components under `components/testgenai/*` are mounted and used.

### Large unused UI surface

The shadcn-style library under `components/ui/*` is mostly unused in the real app.

Confirmed external usage found outside `components/ui/*`:

- `components/ui/scroll-area.tsx`

Confirmed unmounted utility components:

- `components/ui/toaster.tsx`
- `components/ui/sidebar.tsx`

### Duplicate hooks

There are duplicate hook implementations:

- `hooks/use-toast.ts`
- `components/ui/use-toast.ts`
- `hooks/use-mobile.tsx`
- `components/ui/use-mobile.tsx`

Current references only point to the `hooks/*` versions from otherwise unused UI components.

### Practical conclusion

The repo contains a lot of scaffold/vendor UI code that is not contributing to the hackathon MVP.

## 9. Missing Features Report

### Missing from the MVP requirement

1. Real AST analysis
   - No AST implementation found in frontend or backend.
   - Analysis is prompt-based LLM extraction.

2. Real frontend-backend integration
   - Mock service layer still owns every workflow.

3. Contract-normalized APIs
   - Frontend types and backend responses do not match.

4. Real source-code-to-test pipeline
   - Uploaded file content is not preserved in frontend state.

5. Working download generated tests UI flow
   - Backend route exists, UI entry point does not.

6. Real coverage reporting on source files
   - Current FastAPI route targets generated tests folder.

7. Real execution logs
   - Only mocked logs exist.

8. Repository or multi-file analysis backend
   - UI suggests more than backend actually supports.

9. Evaluation results backend
   - No backend source for the evaluation page.

10. Deployment configuration
   - No `.env.example`
   - No Docker setup
   - No clear backend startup orchestration

## 10. Critical Bugs Report

### P0 bugs and blockers

1. No real integration path exists
   - Severity: Critical
   - Result: The product cannot perform its advertised workflow.

2. AST requirement is unimplemented
   - Severity: Critical
   - Result: Core use case is not actually delivered.

3. Uploaded source content is discarded
   - Severity: Critical
   - Result: Real test generation from uploaded files cannot work from current frontend state model.
   - Evidence:
     - `lib/testgenai-types.ts:15-25`
     - `lib/mock-data.ts:50-65`
     - `components/testgenai-provider.tsx:410-431`

4. Coverage route measures the wrong target
   - Severity: Critical
   - Result: Coverage metrics are not trustworthy.
   - Evidence:
     - `backend/main.py:121-125`
     - Uses `--cov=backend/generated_tests`

5. Multi-language upload promise is false
   - Severity: High
   - Result: Frontend allows many extensions; backend upload only accepts `.py`.
   - Evidence:
     - `lib/mock-data.ts:18`
     - `app/api/upload/route.ts:19-24`

6. TypeScript API handlers do not type-check cleanly
   - Severity: High
   - Verified by `cmd /c npx tsc --noEmit`
   - Errors:
     - `app/api/analyze/route.ts:77`
     - `app/api/generate-tests/route.ts:63,72,75`
     - `app/api/generate-userstory-tests/route.ts:60`

7. Lint script is broken
   - Severity: Medium
   - Verified by `cmd /c npm run lint`
   - Result: lint command is not usable in current setup.

8. Production build is network-fragile
   - Severity: Medium
   - Verified by `cmd /c npm run build`
   - Failure: `next/font` could not fetch `JetBrains Mono` from Google Fonts in the audit environment.

## 11. Risk Assessment

### Highest risks

- Demo risk: judges may discover the UI is mock-backed.
- Integration risk: removing mocks will immediately expose contract breakage.
- Scope risk: the project description suggests multi-language and repository-wide support, but the code only hints at Python single-file support.
- Credibility risk: coverage and execution outputs are currently simulated or structurally misleading.
- Deployment risk: frontend and FastAPI startup/orchestration are not packaged as one system.

### Risk by category

Product risk:

- High

Technical risk:

- High

Demo risk:

- Medium for screenshot-only judging
- High for live functional judging

Deployment risk:

- High

## 12. Deployment Readiness Assessment

### Current score

22/100

### Reasons

- No `.env.example`
- `GROQ_API_KEY` required but undocumented in repo files
- Next build failed in audit environment
- TypeScript API routes fail `tsc --noEmit`
- Lint script is broken
- FastAPI service is separate and not orchestrated by the Next app
- CORS is hardcoded to localhost
- No Dockerfile or compose file
- No deployment docs for running both services together

### What is deployable today

- A visual frontend demo with mocked state

### What is not deployable today

- A real end-to-end working TestGenAI system

## 13. Demo Readiness Assessment

### Current score

40/100

### Good for demo

- polished UI
- convincing dashboard
- convincing generated-code viewer
- convincing logs and coverage visuals
- screenshot-ready flows

### Bad for demo

- real upload/analyze/generate/execute pipeline is not working end to end
- backend data is not actually driving the interface
- a judge inspecting network calls or asking for a fresh live file upload could expose the gap immediately

### Honest demo framing

This is currently a polished prototype demo, not a verified working MVP.

## Deliverables Matrix

### Essential Deliverables

| Deliverable | Status | Notes |
| --- | --- | --- |
| Source Code Upload | ⚠ Partial | UI supports multiple files, but service is mocked and backend only accepts single `.py` file. |
| User Story Input | ✅ Complete | Text input flow is implemented and functional in the UI. |
| AST Analysis | ❌ Missing | No AST parser found; current analysis is LLM prompt extraction. |
| Function Detection | ⚠ Partial | Demo and backend prototype can infer functions, but not via AST and not in frontend contract shape. |
| Unit Test Generation | ⚠ Partial | Backend route exists for Python source string; frontend viewer is mock-driven. |
| Edge Case Generation | ⚠ Partial | Prompt requests edge cases, but there is no verified separate real edge-case generation pipeline. |
| User Story → Test Case Generation | ⚠ Partial | Backend route exists, but response shape does not match frontend expectations. |
| Generated Test Viewer | ⚠ Partial | Viewer is implemented, but displays mock artifacts. |
| Test Execution | ⚠ Partial | FastAPI endpoint exists, but it is not wired into the UI and input contract is mismatched. |
| Execution Logs | ⚠ Partial | UI log viewer exists, but logs are mocked. |
| Results Dashboard | ⚠ Partial | Dashboard is fully built, but its data is mock-derived. |
| Coverage Reporting | ⚠ Partial | UI exists and backend route exists, but backend measures the wrong target and is not wired to frontend. |
| Download Generated Tests | ⚠ Partial | Backend route exists, but there is no frontend trigger or integrated flow. |
| Error Handling | ⚠ Partial | Some panel errors exist; upload errors are not surfaced and backend integration errors are not exercised. |
| Loading States | ✅ Complete | Most major panels have loading/empty/error states. |
| End-to-End Workflow | ❌ Missing | No live working upload → analyze → generate → run → coverage path. |
| Frontend ↔ Backend Integration | ❌ Missing | Service layer is fully mocked. |
| Working Demo Flow | ⚠ Partial | Visual demo works; real product flow does not. |
| PPT Screenshot Readiness | ✅ Complete | UI is polished enough for presentation screenshots. |
| Source Code PDF Readiness | ❌ Missing | No export/report/document generation flow found. |

### Bonus Deliverables

| Deliverable | Status | Notes |
| --- | --- | --- |
| Self-Healing Retry | ❌ Missing | No retry or regeneration recovery logic. |
| Repository Upload | ❌ Missing | No repo import or archive upload flow. |
| Repository-Wide Analysis | ❌ Missing | No backend logic for true workspace/repository parsing. |
| Multi-File Processing | ⚠ Partial | UI accepts multiple files, but backend and contracts are not truly multi-file. |
| Real-Time Logs | ❌ Missing | Logs are static mock entries. |
| Streaming Execution Output | ❌ Missing | No SSE, websocket, or incremental polling. |
| Coverage Gap Detection | ⚠ Partial | UI displays missing coverage from mock data; backend does not produce real gap analysis. |
| Downloadable Reports | ❌ Missing | No downloadable audit/test/coverage report feature found. |
| GitHub Integration | ❌ Missing | No GitHub repo ingestion or integration path found in app code. |
| Docker Execution | ❌ Missing | No Docker runtime or isolated execution flow found. |

## Priority List

### P0 Critical Tasks

1. Replace `lib/services/testgenai.ts` mocks with real API calls.
2. Decide and lock MVP scope: Python-only single-file vs multi-file/multi-language.
3. Normalize API contracts so frontend types match backend responses.
4. Implement real AST analysis for the chosen MVP language.
5. Preserve uploaded file content or backend-issued file IDs through the whole workflow.
6. Wire real test execution and coverage into the UI.
7. Fix build, typecheck, and lint blockers before demo day.

### P1 Important Tasks

1. Add a real download generated tests button and flow.
2. Surface upload and bootstrap errors in the UI.
3. Add `.env.example` and startup instructions for both services.
4. Fix coverage semantics to measure source-under-test, not generated tests.
5. Replace the default-empty `/api/results` fallback with explicit error signaling.
6. Align accepted file types with actual backend support.
7. Add minimal automated verification for the happy path.

### P2 Nice-to-Have Tasks

1. Multi-file repository-wide analysis.
2. Streaming execution logs.
3. Downloadable reports.
4. Dockerized execution sandbox.
5. GitHub/repository integration.

## Missing Implementations Requiring Approval Before Coding

Per request, no code changes were made. These are the highest-impact missing implementations and the effort to add them.

| Missing implementation | Why it is missing | Files involved | Estimated effort |
| --- | --- | --- | --- |
| Real frontend service layer | `lib/services/testgenai.ts` is a simulator, not an HTTP client | `lib/services/testgenai.ts`, `components/testgenai-provider.tsx`, all `app/api/*` routes | 3-5 hours |
| Real AST analysis | No AST library or parser code exists; analysis is LLM prompt-based | `app/api/analyze/route.ts`, possibly new backend parser modules, `lib/testgenai-types.ts` | 4-8 hours for Python-only MVP |
| Contract alignment | Frontend types and backend responses diverge heavily | `lib/testgenai-types.ts`, `lib/services/testgenai.ts`, `app/api/*`, `backend/main.py`, UI panels | 3-6 hours |
| Real execution + coverage integration | UI expects rich execution objects, backend returns minimal payloads and wrong coverage target | `backend/main.py`, `components/testgenai-provider.tsx`, `coverage-panel.tsx`, `execution-center.tsx`, `log-viewer.tsx` | 4-6 hours |
| Download/tests/results UX completion | Backend routes exist but no frontend workflow uses them | `app/api/download-tests/route.ts`, `app/api/results/route.ts`, `components/testgenai/*`, possibly new buttons | 1-2 hours |

## Top 10 Remaining Tasks

1. Remove mock service calls and connect the provider to real APIs.
2. Implement real AST extraction for the MVP language.
3. Redesign backend responses to match frontend state contracts.
4. Make upload store real server-side file references or content.
5. Wire generated test output into execution endpoint calls.
6. Fix coverage to measure uploaded source modules.
7. Add a real generated-tests download action in the UI.
8. Add `.env.example` and runtime boot instructions.
9. Fix TypeScript route errors and broken lint setup.
10. Replace fake default dashboard data with real empty-state-first behavior.

## Estimated Time Remaining To Reach MVP

For a Python-only, single-file, honest working MVP:

- 16 to 24 engineer-hours

For a multi-file, more judge-resistant MVP with cleaner contracts and real coverage:

- 2 to 4 focused engineering days

For the broader multi-language vision currently implied by the UI:

- Not realistic within normal hackathon time unless the scope is heavily simplified.

## Final Verdict

This project is not currently a working automated test-case generator system.

It is:

- a strong frontend prototype
- a partially built backend prototype
- a disconnected integration story

The most important strategic move is to narrow the MVP immediately:

- Python only
- single-file upload
- real AST extraction
- real test generation
- real execution
- real coverage

If that slice is completed cleanly, the hackathon demo can become credible very quickly. Without that narrowing, the current implementation risks looking polished but collapsing under live scrutiny.
