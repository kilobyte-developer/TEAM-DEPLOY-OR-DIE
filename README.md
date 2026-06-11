# TESTGEN-AI

TESTGEN-AI is an automated test case generation and validation platform built for the Capgemini AgentifAI Buildathon 2026 by Team Deploy or Die. It accepts Python source files or user stories, generates human-readable and executable tests, runs pytest, calculates coverage, and exports professional HTML reports.

## Features

- Python `.py` file upload
- AST-based source code analysis
- Human-readable semantic test generation
- Intent-based expected output generation
- Logic issue detection for suspicious implementations
- Executable pytest artifact generation
- Semantic behavior assertions inside generated pytest files
- Real pytest execution with pass/fail logs
- Coverage reporting through pytest-cov
- User story test generation
- OpenAI user-story generation with Gemini fallback
- Local deterministic fallback generator
- Source-code and user-story HTML report downloads
- Dashboard, generation, execution, coverage, and evaluation views

## Architecture

### Frontend

- Next.js App Router and React
- Central app state in `components/testgenai-provider.tsx`
- API client helpers in `lib/services/testgenai.ts`
- Dashboard and workflow views in `components/views/`
- Test, execution, coverage, and report UI in `components/testgenai/`

### Backend

- Python AST and test-generation engine in `backend/mvp_engine.py`
- FastAPI service in `backend/main.py` for coverage and backend health
- Next.js API routes in `app/api/` for upload, analysis, generation, execution, results, downloads, and user-story generation

### AI

- OpenAI `gpt-4.1-mini` is used for user-story test generation when `OPENAI_API_KEY` is configured.
- Gemini `gemini-2.5-flash-lite` is attempted as fallback when `GEMINI_API_KEY` is configured.
- A local deterministic fallback always returns user-story tests if LLM providers are unavailable.
- Source-code intent analysis is deterministic and AST-based in the current implementation.

### Execution

- Generated pytest files are written to `/tmp/testgenai_generated_tests`.
- Test execution reads the generated manifest and runs pytest against the generated unit and edge test files.
- Execution results are stored in `/tmp/testgenai_reports/results.json`.

### Coverage

- FastAPI `/coverage` runs pytest-cov against the latest generated manifest.
- Coverage output is stored in `/tmp/testgenai_reports/coverage.json`.

### Reporting

- HTML reports are generated client-side in `lib/report/html-report.ts`.
- Reports can be downloaded from Generator, Execution, and Coverage pages.

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend

- Python
- FastAPI
- Uvicorn
- Python `ast`

### AI

- OpenAI chat completions API
- Gemini generateContent API
- Local deterministic fallback logic

### Testing

- pytest
- pytest-cov

### Reporting

- Client-side HTML generation
- Browser Blob download

## Installation

### Prerequisites

- Node.js 18 or newer
- pnpm
- Python 3.11 recommended
- Optional OpenAI API key
- Optional Gemini API key

### Install Frontend Dependencies

```bash
pnpm install
```

### Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### Environment Variables

Create or update `.env` in the project root:

```env
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
OPENAI_API_KEY=
GEMINI_API_KEY=
LLM_PROVIDER_PRIORITY=openai
```

API keys are optional for user-story mode because the local fallback generator still works.

## Startup

### Start Next.js

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

### Start FastAPI Coverage Service

```bash
cd backend
uvicorn main:app --reload --port 8000
```

FastAPI is required for coverage. Source upload, source analysis, test generation, and execution are handled through Next.js API routes.

## Usage

### Source Code Mode

1. Open Input Workspace.
2. Upload a Python `.py` file.
3. Run analysis.
4. Open Generator and generate tests.
5. Review human-readable semantic cases and generated pytest code.
6. Open Execution and run tests.
7. Open Coverage and refresh coverage.
8. Download the HTML report.

### User Story Mode

1. Switch to User Story mode.
2. Paste a user story with acceptance criteria.
3. Generate test cases.
4. Review positive, negative, and edge cases.
5. Download the HTML report.

## Screens / Modules

- Overview: dashboard statistics, workflow, activity, quick actions
- Input Workspace: source upload or user-story input
- Generator: analysis summary, semantic cases, generated artifacts, story cases
- Execution: pytest run controls and execution logs
- Coverage: coverage metrics and missing-function summary
- Evaluation: generated suite quality summary
- User Story Mode: scenario-driven QA suite generation

## Team

Team Name: Deploy or Die

- Atharva: Project lead, architecture, backend integration, AI testing logic, execution pipeline, prompt engineering, system design, documentation oversight
- Yogesh: Frontend development, UI components, frontend state management, frontend integration, dashboard views, user experience
- Nikhil: Datasets, testing data, validation assets, supporting QA material

## Future Scope

- Persist historical report snapshots
- Add richer class-method semantic execution support
- Add more source-code intent detectors
- Add multi-file project support
- Add PDF export through print-ready reports
- Add authentication and team workspaces

## License

Hackathon project for Capgemini AgentifAI Buildathon 2026. Add a formal open-source license before public production use.
