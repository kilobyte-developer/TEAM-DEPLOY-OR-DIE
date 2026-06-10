# Code Understanding README

This document explains TESTGENAI in simple language for team members preparing for demos, interviews, jury questions, or viva rounds.

## Project Flow

TESTGENAI has two main modes.

Source Code Mode:

1. User uploads a Python file.
2. The app stores the file in `/tmp/testgenai_uploads`.
3. The backend engine analyzes the Python AST.
4. The engine generates human-readable semantic test cases.
5. The engine generates executable pytest files.
6. The user runs pytest from the Execution page.
7. The user refreshes coverage from the Coverage page.
8. The user downloads an HTML report.

User Story Mode:

1. User enters a user story.
2. The app sends it to `/api/generate-userstory-tests`.
3. The route tries OpenAI, then Gemini, then local fallback.
4. The output is shown as positive, negative, and edge cases.
5. The user downloads a user-story HTML report.

## How Upload Works

### Files Involved

- `components/testgenai/code-upload-panel.tsx`
- `components/testgenai-provider.tsx`
- `lib/services/testgenai.ts`
- `app/api/upload/route.ts`

### Request Flow

1. The user selects a `.py` file.
2. `CodeUploadPanel` calls `uploadFiles`.
3. `TestGenAIProvider` calls `uploadFile` from `lib/services/testgenai.ts`.
4. The service sends a `FormData` request to `/api/upload`.
5. `app/api/upload/route.ts` validates the extension and writes the file to `/tmp/testgenai_uploads`.

### Response Flow

The route returns file metadata:

- id
- name
- language
- size
- upload status
- upload timestamp
- repository
- source

### State Flow

The provider stores uploaded files in `state.uploadedFiles` and selects the latest uploaded file.

## How Source Analysis Works

### Files Involved

- `app/api/analyze/route.ts`
- `backend/mvp_engine.py`
- `components/testgenai/analysis-panel.tsx`

### AST Parsing

The route runs:

```bash
python backend/mvp_engine.py analyze <uploaded-file-path>
```

Inside `mvp_engine.py`, Python's `ast` module parses source code.

### Function Extraction

For each top-level function, the engine extracts:

- function name
- parameters
- return annotation
- file name
- dependencies
- description from docstring or fallback text

### Class Extraction

For each class, the engine extracts:

- class name
- methods
- method parameters
- method descriptions

### Dependency Extraction

The engine reads `import` and `from ... import ...` statements and creates an ordered dependency list.

### Analysis Output

The output shape is defined in `AnalysisResult` in `lib/testgenai-types.ts`.

## How Human Readable Test Generation Works

### Files Involved

- `backend/mvp_engine.py`
- `components/testgenai/test-viewer.tsx`
- `lib/testgenai-types.ts`

### OpenAI Flow

OpenAI is not used for source-code human-readable generation in the current code. Source-code semantic generation is deterministic.

### Gemini Flow

Gemini is not used for source-code human-readable generation in the current code.

### Fallback Flow

The deterministic engine is the source-code generation path. It uses AST, function names, parameters, and simple implementation patterns.

### Prompt Flow

`backend/prompts/generate_test_cases.md` contains intent instructions, but the current source-code route does not call an LLM with that prompt.

### Response Flow

`generate_tests_for_file` returns:

- `semanticSuites`
- `unitTests`
- `edgeCaseTests`
- `summary`

### Storage Flow

The engine writes:

- unit pytest file
- edge pytest file
- combined test file
- `manifest.json`

These are stored in `/tmp/testgenai_generated_tests`.

## How Intent-Based Testing Works

### Function Name Interpretation

`mvp_engine.py` splits function names into words. For example:

- `is_even` becomes `is`, `even`
- `calculate_discount` becomes `calculate`, `discount`

If the function name suggests intent, the expected output follows the name, not the implementation.

### Potential Logic Issue Detection

The engine checks whether implementation contradicts intent.

Example:

```python
def is_even(n):
    return n % 2 == 1
```

The name says even, but the implementation returns true for odd numbers. The engine reports a high-confidence logic issue.

### Expected Outcome Inference

For `is_even`, expected outcomes include:

- `n = 2` -> true
- `n = 3` -> false
- `n = 0` -> true

For `calculate_discount`, expected behavior is that the discounted amount should be less than the original price and not negative.

### Semantic Test Production

Each semantic suite can include:

- unit tests
- negative tests
- edge cases
- boundary cases
- potential logic issues

## How User Story Generation Works

### Files Involved

- `app/api/generate-userstory-tests/route.ts`
- `components/testgenai/user-story-panel.tsx`
- `components/testgenai/user-story-test-viewer.tsx`

### Story Parsing

The route reads `user_story` from the request body.

### Acceptance Criteria Extraction

If the story contains an `Acceptance Criteria:` section, the route splits numbered or bullet criteria into individual rules.

### Positive Tests

For each parsed rule, the generator creates a passing scenario.

Example:

- Rule: daily limit is INR 50,000
- Positive case: transfer below the limit

### Negative Tests

For each rule, the generator creates a violating scenario.

Example:

- Rule: OTP required above INR 25,000
- Negative case: transfer above threshold without OTP

### Edge Cases

For boundary-friendly rules, the generator creates exact-threshold tests.

Example:

- exactly INR 50,000
- exactly 5 minutes
- exactly minimum age

### Business Rules

The local generator detects categories such as:

- amount minimum
- daily limits
- OTP threshold
- OTP expiry
- recipient existence
- sufficient balance
- age or numeric ranges
- credit score minimums
- percentage limits
- document requirements
- duplicate windows
- outcome display rules

## How Executable Tests Are Generated

### Files Involved

- `backend/mvp_engine.py`
- `app/api/generate-tests/route.ts`

### Semantic Cases to Executable Tests

The function `build_semantic_assertion_tests` converts safe semantic cases into pytest assertions.

It supports:

- boolean expectations
- exact primitive literals
- safe discount comparisons
- safe range checks

### Pytest File Creation

The engine writes:

- `test_<filename>_unit.py`
- `test_<filename>_edge.py`
- `test_generated.py`
- `manifest.json`

### Artifact Storage

Generated artifacts are stored in:

```text
/tmp/testgenai_generated_tests
```

## How Execution Works

### Files Involved

- `app/api/run-tests/route.ts`
- `components/testgenai/execution-center.tsx`
- `components/testgenai/log-viewer.tsx`

### FastAPI Flow

FastAPI also has a `/run-tests` endpoint in `backend/main.py`, but the current frontend service calls the Next.js `/api/run-tests` route.

### Pytest Execution Flow

1. `/api/run-tests` reads `/tmp/testgenai_generated_tests/manifest.json`.
2. It runs:

```bash
python -m pytest <unit-test-file> <edge-test-file> -v --tb=short
```

3. It captures stdout and stderr.
4. It parses total, passed, and failed counts.
5. It returns structured execution results.

### Result Collection

The route stores results in:

```text
/tmp/testgenai_reports/results.json
```

### Result Persistence

The Results API reads from `/tmp/testgenai_reports/results.json`.

## How Coverage Works

### Files Involved

- `backend/main.py`
- `lib/services/testgenai.ts`
- `components/testgenai/coverage-panel.tsx`

### Coverage Collection

The frontend calls:

```text
<NEXT_PUBLIC_FASTAPI_URL>/coverage
```

### Coverage Calculation

FastAPI reads the latest manifest and runs pytest with:

```bash
pytest <unit-test-file> <edge-test-file> --cov=<module> --cov-report=json:<coverage-path>
```

### Coverage Reporting

Coverage output includes:

- coverage percentage
- functions covered
- functions missing coverage
- edge cases covered
- by-file coverage

## How HTML Report Generation Works

### Files Involved

- `lib/report/html-report.ts`
- `components/testgenai/download-report-button.tsx`

### Report Flow

1. User clicks Download Report.
2. The button calls `downloadTestGenAIReport`.
3. The report generator reads current frontend state.
4. It builds a full HTML document as a string.
5. The browser downloads it with a timestamped filename.

### Report Structure

Source-code report includes:

- metadata
- analysis summary
- human-readable cases
- generated pytest code
- execution summary
- coverage summary
- logs

User-story report includes:

- story
- acceptance criteria
- positive cases
- negative cases
- edge cases
- business rules
- provider metadata

### Download Process

The browser creates a Blob and downloads:

```text
testgenai-report-YYYYMMDD-HHMM.html
```

## Folder Structure Explanation

### `app/`

Next.js App Router pages and API routes.

### `app/api/`

Server-side routes for upload, analyze, generate tests, generate user-story tests, run tests, get results, and download generated tests.

### `components/`

Reusable React components.

### `components/views/`

Full page views:

- dashboard
- upload
- generate
- execution
- results
- metrics

### `components/testgenai/`

Feature-specific UI modules for upload, analysis, test viewer, user-story viewer, execution, logs, coverage, reports, and workflow.

### `components/ui/`

General UI primitives.

### `lib/`

Shared TypeScript utilities, services, types, mock data, and report generation.

### `lib/services/`

Frontend API wrappers.

### `lib/report/`

Client-side HTML report builder.

### `backend/`

Python backend and generation engine.

### `backend/mvp_engine.py`

Core AST analysis, semantic generation, executable test generation, and manifest writing.

### `backend/main.py`

FastAPI app for coverage and health.

### `backend/prompts/`

Prompt guidance used as project documentation for LLM-oriented generation behavior.

### `tests/`

Dataset and validation files.

### `backend/generated_tests/`

Older generated artifacts from previous local runs. Current frontend generation writes to `/tmp/testgenai_generated_tests`.

### `backend/reports/`

Older or local report artifacts. Current execution results are written to `/tmp/testgenai_reports`.

## Common Interview Questions

### 1. What does TESTGENAI do?

It generates test cases from Python source code and user stories, runs executable pytest tests, calculates coverage, and exports reports.

### 2. What are the two input modes?

Source Code mode and User Story mode.

### 3. How does upload work?

The frontend sends a `.py` file to `/api/upload`. The route saves it in `/tmp/testgenai_uploads` and returns metadata.

### 4. Why only Python files?

The current engine uses Python's `ast` module, so MVP support is limited to Python.

### 5. How does AST analysis work?

`mvp_engine.py` parses source code with `ast.parse`, walks top-level functions and classes, and extracts metadata.

### 6. What metadata is extracted?

Functions, classes, methods, parameters, return annotations, imports, dependencies, and descriptions.

### 7. Does source-code generation use OpenAI?

No. Source-code generation is deterministic in the current implementation.

### 8. Where is OpenAI used?

OpenAI is used in `/api/generate-userstory-tests` for user-story test generation.

### 9. Which OpenAI model is used?

The route is configured for `gpt-4.1-mini`.

### 10. Where is Gemini used?

Gemini is used as fallback in `/api/generate-userstory-tests`.

### 11. Which Gemini model is used?

The route is configured for `gemini-2.5-flash-lite`.

### 12. What happens if both API keys are missing?

The local deterministic user-story generator runs and still returns test cases.

### 13. How does user-story parsing work?

The route extracts acceptance criteria and classifies rules such as thresholds, limits, OTP rules, ranges, documents, and outcomes.

### 14. What is intent-based testing?

It means expected outputs follow the function's intended meaning, such as `is_even`, instead of blindly trusting faulty implementation logic.

### 15. How is a logic issue detected?

The engine compares semantic intent with known implementation patterns. If they conflict, it records a potential logic issue.

### 16. Give an example of logic issue detection.

If `is_even` returns `n % 2 == 1`, the engine says the function name suggests even numbers but implementation returns true for odd numbers.

### 17. What is a semantic suite?

It is a human-readable group of unit tests, negative tests, edge cases, boundary cases, and potential logic issues for one function.

### 18. How do semantic cases become executable?

Safe semantic cases are converted to pytest assertions by `build_semantic_assertion_tests`.

### 19. What executable assertions are allowed?

Boolean assertions, exact literal equality, and safe relational discount checks.

### 20. What happens if a semantic case is uncertain?

No behavior assertion is generated for that case, and existing availability or signature tests remain.

### 21. Where are pytest files stored?

Current generated pytest files are stored in `/tmp/testgenai_generated_tests`.

### 22. What does the manifest contain?

It contains source file path, module name, generated unit and edge test paths, analysis, semantic suites, and summary.

### 23. How does execution work?

The Next.js run-tests route reads the manifest and runs pytest against the generated unit and edge test files.

### 24. How are logs shown?

The route captures pytest output, classifies each line, and the frontend displays it in `LogViewer`.

### 25. How is coverage calculated?

FastAPI runs pytest with `pytest-cov` and returns coverage metrics.

### 26. Why does coverage require FastAPI?

The frontend coverage service calls the FastAPI `/coverage` endpoint.

### 27. What is the report generator?

`lib/report/html-report.ts` builds standalone HTML reports from frontend state.

### 28. Does report generation need a backend?

No. It is client-side and uses browser Blob download.

### 29. What does a source report include?

Metadata, analysis, semantic tests, pytest artifacts, execution summary, coverage, logs, and footer.

### 30. What does a user-story report include?

Story, acceptance criteria, positive cases, negative cases, edge cases, business rules, and generation metadata.

### 31. How is frontend connected to backend?

React components call context actions. Context actions call `lib/services/testgenai.ts`. Services call Next.js API routes or FastAPI coverage.

### 32. What design patterns are used?

Centralized provider state, API service wrapper, deterministic engine functions, and component-based UI composition.

### 33. What would you improve for production?

Add authentication, persistence, isolated execution sandboxing, multi-file support, broader language support, and better provider telemetry.

### 34. What is the strongest MVP feature?

The end-to-end path from Python upload to semantic pytest execution, coverage, and downloadable report.

### 35. What is the safest fallback mechanism?

For user stories, local deterministic generation ensures test cases are returned even without LLM keys.

## System Design Questions

### Why split Next.js API routes and FastAPI?

Next.js API routes handle frontend-adjacent workflows such as upload and generation. FastAPI handles Python-native coverage operations.

### What is the main data contract?

The TypeScript interfaces in `lib/testgenai-types.ts` define the frontend data contract.

### Why use `/tmp` directories?

They provide simple hackathon-friendly runtime storage without a database.

### How would this scale?

Production scaling would require persistent storage, job queues, isolated workers, per-user directories, and authentication.

### How does the system avoid crashing when LLMs fail?

The user-story route catches provider failures and falls back to the next provider or the local generator.

### How does the system detect stale execution artifacts?

The current run route reads the manifest from the same `/tmp/testgenai_generated_tests` directory used by generation.

### Why is deterministic source generation useful?

It is fast, predictable, and works without external APIs.

### What is the risk of deterministic generation?

It only covers implemented heuristics and cannot infer every business rule from arbitrary code.

## Debugging Guide

### Problem: Upload fails.

Check that the file has a `.py` extension.

### Problem: Analysis fails.

Check that the uploaded Python file has valid syntax.

### Problem: Generated tests do not match the newest file.

Regenerate tests after selecting/uploading the target file. Restart Next.js if API route changes were recently made.

### Problem: Execution says no generated tests found.

Run Generate Tests first. The manifest must exist in `/tmp/testgenai_generated_tests`.

### Problem: Execution shows old tests.

Check whether the app is reading `/tmp/testgenai_generated_tests/manifest.json`. Restart the Next.js dev server after route changes.

### Problem: Coverage fails.

Start FastAPI and verify `NEXT_PUBLIC_FASTAPI_URL` points to the running backend.

### Problem: User-story generation works without API keys.

That is expected. The local fallback generator is active.

### Problem: HTML report button is disabled.

Generate source tests or user-story tests first.

### Problem: Faulty code still passes.

Check whether semantic assertions were generated in the pytest artifact. Some descriptive cases intentionally fall back to availability tests.

## Architecture Walkthrough

End-to-end source-code lifecycle:

1. User uploads `file.py`.
2. `/api/upload` saves it to `/tmp/testgenai_uploads/file.py`.
3. User clicks Analyze.
4. `/api/analyze` runs `mvp_engine.py analyze`.
5. Frontend stores `AnalysisResult`.
6. User clicks Generate Tests.
7. `/api/generate-tests` runs `mvp_engine.py generate-tests`.
8. The engine creates semantic suites and pytest files.
9. Frontend displays human-readable cases and code artifacts.
10. User clicks Run Tests.
11. `/api/run-tests` runs pytest from the generated manifest.
12. Frontend displays execution summary and logs.
13. User clicks Refresh Coverage.
14. FastAPI `/coverage` runs pytest-cov.
15. Frontend displays coverage.
16. User clicks Download Report.
17. Browser downloads a standalone HTML report.
