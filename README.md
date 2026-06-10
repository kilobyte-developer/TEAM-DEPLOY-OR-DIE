# TestGenAI

Automated test case generator agent. Upload Python code, analyze functions, generate unit and edge-case tests, execute them with pytest, and collect coverage metrics.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: FastAPI, Python
- **Test Engine**: pytest, pytest-cov
- **LLM**: Groq (for analysis generation)

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.9+
- Groq API key (get one at https://console.groq.com)

## Setup & Run

### Terminal 1 — Next.js Frontend (Port 3000)

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 in browser.

### Terminal 2 — FastAPI Backend (Port 8000)

**Required for test execution. Must be running in parallel.**

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate          # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --port 8000
```

You should see: `INFO: Uvicorn running on http://127.0.0.1:8000`

### Environment Variables

Create `.env.local` in project root:

```
GROQ_API_KEY=your_groq_api_key_here
```

## Workflow

1. **Input Workspace** → Upload Python file
2. **Input Workspace** → Click "Analyze Workspace" (parses code structure)
3. **Generator** → Click "Generate Source Code Tests" (creates unit + edge-case tests)
4. **Execution** → Click "Run Tests" (executes pytest, requires backend running)
5. **Coverage** → View coverage metrics

## API Endpoints

### Next.js Routes (Port 3000)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Upload Python file |
| POST | `/api/analyze` | Analyze code structure (AST parsing) |
| POST | `/api/generate-tests` | Generate unit and edge-case tests |
| POST | `/api/generate-userstory-tests` | Generate tests from user story |
| GET | `/api/results` | Get last test execution results |

### FastAPI Routes (Port 8000)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/run-tests` | Execute pytest on generated tests |
| GET | `/coverage` | Calculate code coverage |
| GET | `/health` | Health check |

## Troubleshooting

**"Execution failed. NetworkError when attempting to fetch resource"**
- FastAPI backend is not running. Start it in Terminal 2.

**"python: command not found"**
- Use `python3` instead of `python` on Linux/Mac.

**Tests won't generate**
- Ensure you clicked "Analyze Workspace" first and got results.