# TestGenAI

Automated test case generation and validation for Python source code. Upload a `.py` file or paste a user story, generate unit and edge-case tests, execute them with pytest, and view coverage metrics — all from a single interface.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **Test Engine**: pytest, pytest-cov
- **LLM**: OpenAI `gpt-4.1-mini` (primary) · Gemini `gemini-2.5-flash-lite` (fallback) · local deterministic fallback

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.11 recommended (3.9+ minimum)
- Optional: OpenAI API key or Gemini API key (user story mode works without either via local fallback)

## Setup

### 1. Install frontend dependencies

```bash
pnpm install
```

### 2. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Environment variables

Copy `.env.example` to `.env.local` in the project root and fill in your values:

```bash
cp .env.example .env.local
```

```env
# ── Next.js (frontend) ──────────────────────────────────────
# URL of the FastAPI backend (use localhost for local dev)
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000

# ── LLM providers ───────────────────────────────────────────
OPENAI_API_KEY=sk-...          # primary LLM (optional)
GEMINI_API_KEY=AIza...         # fallback LLM (optional)
GEMINI_AI_FIXATIONS_API_KEY=AIza...
GEMINI_SOURCE_CODE_TESTS_API_KEY=AIza...

# Which provider to try first: "openai" or "gemini" (default: openai)
LLM_PROVIDER_PRIORITY=openai

# ── Supabase ─────────────────────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

All API keys are optional for local development. The local fallback handles user story generation if neither OpenAI nor Gemini is configured. Supabase keys are only required if database persistence is enabled.

## Running

Two services must run in parallel.

**Terminal 1 — Next.js (port 3000)**

```bash
pnpm dev
```

Open `http://localhost:3000`.

**Terminal 2 — FastAPI (port 8000)**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
venv/bin/python -m uvicorn main:app --reload --port 8000
# Windows: venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

FastAPI is required for test execution and coverage. Source upload, analysis, generation, and user story routes are handled by Next.js API routes.

## Workflow

### Source Code Mode

1. **Input Workspace** → Upload a Python `.py` file
2. **Input Workspace** → Click "Analyze Workspace" (AST parsing)
3. **Generator** → Click "Generate Source Code Tests"
4. **Execution** → Click "Run Tests" (FastAPI must be running)
5. **Coverage** → View coverage metrics
6. Download the HTML report from Generator, Execution, or Coverage pages

### User Story Mode

1. Switch to **User Story** mode in Input Workspace
2. Paste a user story with acceptance criteria
3. Click "Generate Tests" — produces positive, negative, and edge cases
4. Download the HTML report

## API Reference

### Next.js Routes (port 3000)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Upload Python file |
| POST | `/api/analyze` | Analyze code structure via AST |
| POST | `/api/generate-tests` | Generate unit and edge-case tests |
| POST | `/api/generate-userstory-tests` | Generate tests from user story |
| GET | `/api/results` | Retrieve last execution results |

### FastAPI Routes (port 8000)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/run-tests` | Execute pytest on generated tests |
| GET | `/coverage` | Calculate coverage via pytest-cov |
| GET | `/health` | Health check |

## Troubleshooting

**"Execution failed. NetworkError when attempting to fetch resource"**
FastAPI backend is not running. Start it in Terminal 2.

**"python: command not found"**
Use `python3` on Linux/macOS.

**"No module named pytest" when running tests**
Make sure you started the FastAPI server using the venv Python, not the system Python:
```bash
venv/bin/python -m uvicorn main:app --reload --port 8000
```

**Tests won't generate**
Run analysis first and confirm results appear before generating.

## CI / CD

Automated CI via GitHub Actions has been removed (`.github/workflows/ci.yml` deleted). Run tests locally before merging:

```bash
# Frontend
pnpm lint

# Backend
cd backend && source venv/bin/activate && pytest
```