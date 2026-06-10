# Final Deliverables Report

## Project Overview

### Problem Statement

Manual test-case creation is slow, inconsistent, and often disconnected from real execution. Developers and QA teams need a way to move from source code or user stories to useful test cases, executable tests, results, coverage, and reports quickly.

### Project Objective

TESTGENAI helps generate and validate test cases from two inputs:

- Python source code
- User stories with acceptance criteria

The project provides human-readable QA cases, executable pytest artifacts, execution results, coverage summaries, and downloadable HTML reports.

### Why TestGenAI Was Built

TestGenAI was built to demonstrate an agent-assisted QA workflow for the Capgemini AgentifAI Buildathon 2026. The system is designed to help judges, developers, QA leads, and managers see what was analyzed, what tests were generated, what passed, what failed, and what coverage was achieved.

## Architecture Overview

### Frontend Architecture

The frontend is a Next.js App Router application. The main UI state is managed by `components/testgenai-provider.tsx`. Service calls are wrapped by `lib/services/testgenai.ts`. Major views live in `components/views/`, and reusable workflow panels live in `components/testgenai/`.

Frontend pages:

- `app/page.tsx`
- `app/upload/page.tsx`
- `app/generate/page.tsx`
- `app/execution/page.tsx`
- `app/results/page.tsx`
- `app/metrics/page.tsx`

### Backend Architecture

The backend logic is split between Next.js API routes and Python services.

- Next.js API routes in `app/api/` handle upload, source analysis, test generation, user-story generation, test execution, result retrieval, and generated test download.
- `backend/mvp_engine.py` performs AST analysis, semantic test generation, executable pytest generation, and manifest writing.
- `backend/main.py` exposes FastAPI endpoints for health, coverage, and an additional backend run-tests implementation.

### AI Layer

The AI layer is implemented in `app/api/generate-userstory-tests/route.ts`.

Provider order:

1. OpenAI `gpt-4.1-mini`
2. Gemini `gemini-2.5-flash-lite`
3. Local deterministic fallback

Source-code test generation is deterministic and AST-based in the current implementation.

### Execution Layer

Executable tests are generated as pytest files. The current Next.js execution route reads the manifest from `/tmp/testgenai_generated_tests/manifest.json`, runs pytest against the latest unit and edge test files, parses pass/fail counts, and stores results in `/tmp/testgenai_reports/results.json`.

### Coverage Layer

Coverage is calculated by `backend/main.py` through FastAPI `/coverage`. It reads the latest manifest, runs pytest with `pytest-cov`, writes `coverage.json`, and returns function-level and file-level coverage information.

### Reporting Layer

HTML reports are generated on the frontend in `lib/report/html-report.ts`. Reports are downloaded from Generator, Execution, and Coverage pages through `components/testgenai/download-report-button.tsx`.

## Completed Deliverables

### Python File Upload

Status: Completed

Files:

- `app/api/upload/route.ts`
- `components/testgenai/code-upload-panel.tsx`
- `components/testgenai-provider.tsx`

Description:

Users can upload Python `.py` files. Files are stored in `/tmp/testgenai_uploads`.

Workflow:

Upload file -> Next.js upload route -> Store file -> Update frontend state

### AST Source Code Analysis

Status: Completed

Files:

- `app/api/analyze/route.ts`
- `backend/mvp_engine.py`
- `components/testgenai/analysis-panel.tsx`

Description:

The Python engine parses uploaded code with `ast`, extracts functions, classes, methods, parameters, return annotations, imports, and dependencies.

Workflow:

Upload -> Analyze -> `mvp_engine.py analyze` -> Analysis displayed in UI

### Human Readable Test Generation

Status: Completed

Files:

- `backend/mvp_engine.py`
- `components/testgenai/test-viewer.tsx`
- `lib/testgenai-types.ts`

Description:

The engine generates semantic suites with unit tests, negative tests, edge cases, boundary cases, and potential logic issues.

Workflow:

Upload -> Analyze -> Generate -> Display semantic test cases

### Intent-Based Test Generation

Status: Completed

Files:

- `backend/mvp_engine.py`
- `backend/prompts/generate_test_cases.md`

Description:

The engine prioritizes semantic intent from function names before trusting implementation behavior. For example, `is_even` is expected to return true for even numbers even if the implementation checks odd numbers.

Workflow:

Generate tests -> Infer intent -> Build expected outcomes -> Detect contradictions

### Logic Issue Detection

Status: Completed

Files:

- `backend/mvp_engine.py`
- `lib/testgenai-types.ts`
- `components/testgenai/test-viewer.tsx`

Description:

Potential logic issues are detected for implemented patterns such as even/odd contradictions and discount functions that increase values.

Workflow:

Parse function -> Compare intent with implementation -> Attach `potentialLogicIssues`

### Executable Pytest Artifact Generation

Status: Completed

Files:

- `backend/mvp_engine.py`
- `app/api/generate-tests/route.ts`

Description:

The engine writes unit test files, edge test files, a combined `test_generated.py`, and a manifest to `/tmp/testgenai_generated_tests`.

Workflow:

Generate -> Build pytest code -> Write artifacts -> Return generated code to UI

### Semantic Test Execution

Status: Completed

Files:

- `backend/mvp_engine.py`
- `app/api/run-tests/route.ts`

Description:

Deterministic semantic cases are converted into executable assertions. Boolean and safe relational expectations become pytest assertions with input, expected, and actual values in failure output.

Workflow:

Semantic case -> Assertion converter -> Pytest artifact -> Run pytest

### Real Pytest Execution

Status: Completed

Files:

- `app/api/run-tests/route.ts`
- `backend/main.py`
- `components/testgenai/execution-center.tsx`
- `components/testgenai/log-viewer.tsx`

Description:

The system executes generated pytest files, parses output, and displays logs and summary metrics.

Workflow:

Generate -> Run Tests -> pytest -> Parse result -> Display execution dashboard

### Coverage Reporting

Status: Completed

Files:

- `backend/main.py`
- `components/testgenai/coverage-panel.tsx`
- `lib/services/testgenai.ts`

Description:

FastAPI runs pytest-cov against the generated tests and reports coverage percentage, covered functions, missing functions, and by-file coverage.

Workflow:

Run coverage -> pytest-cov -> coverage.json -> Coverage UI

### User Story Test Generation

Status: Completed

Files:

- `app/api/generate-userstory-tests/route.ts`
- `components/testgenai/user-story-panel.tsx`
- `components/testgenai/user-story-test-viewer.tsx`

Description:

User stories with acceptance criteria are converted into positive tests, negative tests, and edge cases. The route supports OpenAI, Gemini, and local deterministic fallback.

Workflow:

Enter story -> Generate -> Provider failover -> Display QA suite

### HTML Report Generation

Status: Completed

Files:

- `lib/report/html-report.ts`
- `components/testgenai/download-report-button.tsx`
- `components/views/generate-view.tsx`
- `components/views/execution-view.tsx`
- `components/views/results-view.tsx`

Description:

Users can download standalone HTML reports for source-code mode and user-story mode.

Workflow:

Generate data -> Click Download Report -> Build HTML in browser -> Download `.html`

## AI Features

### OpenAI Integration

Implemented in `app/api/generate-userstory-tests/route.ts`. It calls OpenAI chat completions with model `gpt-4.1-mini` when `OPENAI_API_KEY` is configured.

### Gemini Fallback

Implemented in `app/api/generate-userstory-tests/route.ts`. It calls Gemini `gemini-2.5-flash-lite` when OpenAI fails or priority is configured for Gemini.

### Local Fallback

Implemented in the same route. It parses acceptance criteria locally and always returns a usable test suite if LLM providers are unavailable.

### Intent-Based Test Generation

Implemented in `backend/mvp_engine.py`. The engine checks function names such as `is_even`, `is_odd`, and `calculate_discount`.

### Logic Issue Detection

Implemented in `backend/mvp_engine.py`. Detected issues are returned in semantic suites and shown in reports.

### User Story Understanding

Implemented in `app/api/generate-userstory-tests/route.ts`. The route extracts acceptance criteria, thresholds, time limits, OTP rules, limits, document rules, duplicate windows, and outcome requirements.

## Test Execution Features

### Pytest Execution

Implemented in `app/api/run-tests/route.ts`.

### Semantic Validation

Implemented in `backend/mvp_engine.py` through deterministic semantic assertions.

### Coverage Calculation

Implemented in `backend/main.py` through pytest-cov.

### Result Collection

Execution output is parsed into total tests, passed tests, failed tests, execution time, pass rate, and logs.

### Execution Dashboard

Implemented through `components/testgenai/execution-center.tsx` and `components/testgenai/log-viewer.tsx`.

## Reporting Features

### HTML Reports

Implemented in `lib/report/html-report.ts`.

### Execution Reports

Execution summary and logs are included in source-code HTML reports.

### User Story Reports

User-story reports include story text, acceptance criteria, positive tests, negative tests, edge cases, business rules, and provider metadata.

### Coverage Reports

Coverage reports are shown in the UI and included in source-code HTML reports when coverage data exists.

## Dataset Support

Dataset and validation assets are stored in `tests/`.

Available files:

- `tests/bank.txt`: personal loan user story with acceptance criteria
- `tests/calculator.py`: simple source-code sample
- `tests/check.py`: source-code sample
- `tests/test.py`: source-code sample
- `tests/test2.py`: source-code sample
- `tests/tough.py`: larger banking/domain source-code sample
- `tests/faulty1.py`: faulty source sample for semantic validation
- `tests/is_even.py`: correct even-check sample

Generated runtime artifacts may also exist in:

- `/tmp/testgenai_uploads`
- `/tmp/testgenai_generated_tests`
- `/tmp/testgenai_reports`
- `backend/generated_tests` from older or local runs

## Known Limitations

- Source-code upload is limited to Python `.py` files.
- Source-code LLM generation is not implemented; source-code generation is deterministic and AST-based.
- User-story LLM integration exists only in the Next.js user-story API route.
- Test execution is available only for source-code mode.
- Coverage requires the FastAPI backend to be running and reachable through `NEXT_PUBLIC_FASTAPI_URL`.
- Semantic executable assertions are generated only when expected values are deterministic or safely mappable.
- Class-method semantic behavior assertions are limited; the current converter skips unsafe class-method execution.
- The HTML report is generated from current frontend state and does not persist historical sessions.
- Some stored text fixtures show encoding artifacts for the INR currency symbol in the current workspace.

## Future Scope

- Multi-file repository analysis
- More intent detectors for source code
- More complete class-method executable semantic assertions
- Persistent project history and report archive
- PDF export from HTML reports
- Authentication and team workspaces
- More detailed provider observability and retry logs
- Broader language support beyond Python

## MVP Readiness Assessment

Feature Completion: 90%

Hackathon Readiness: 95%

Production Readiness: 60%

Reasoning:

- The MVP covers the core demo workflow end to end.
- The system has working upload, analysis, generation, execution, coverage, user-story generation, and reports.
- Production would require authentication, persistence, stronger sandboxing, broader test coverage, deployment hardening, and multi-user controls.

## Final Verdict

TESTGENAI is MVP-ready for hackathon demonstration. It successfully turns Python source code and user stories into readable tests, executable pytest artifacts, execution results, coverage data, and downloadable reports.
