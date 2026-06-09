# TestGenAI Development Guide

## Setup Instructions

### 1. Install Frontend Dependencies
```bash
pnpm install
```

### 2. Set Up Backend Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

On Windows, use `venv\Scripts\activate` instead of `source venv/bin/activate`.

### 3. Environment Configuration
Create a `.env.local` file in the project root with your Groq API key:
```
GROQ_API_KEY=your_key_here
```

## Running the Services

### 1. Start Next.js Frontend (Port 3000)
```bash
pnpm dev
```

### 2. Start FastAPI Backend (Port 8000)
```bash
cd backend
source venv/bin/activate
python main.py
```

On Windows:
```bash
cd backend
venv\Scripts\activate
python main.py
```

Or with uvicorn directly (after activating venv):
```bash
uvicorn main:app --reload --port 8000
```

## Complete API Endpoint List

### Next.js API Routes (Port 3000)

| Method | Path | Request Body | Response | Description |
|--------|------|--------------|----------|-------------|
| POST | `/api/upload` | `formData` with `file: File` | `{ file_name, file_size, status }` | Upload Python file |
| POST | `/api/analyze` | `{ file_name: string }` | `{ functions: [{ name, parameters }], classes: [], imports: [] }` | Analyze uploaded code via Gemini |
| POST | `/api/generate-tests` | `{ source_code: string }` | `{ generated_tests: string }` | Generate pytest code via Gemini |
| POST | `/api/generate-userstory-tests` | `{ user_story: string }` | `{ test_cases: [string] }` | Generate test cases from user story |
| GET | `/api/results` | - | `{ tests_generated, passed, failed, pass_rate }` | Get latest test execution results |
| GET | `/api/download-tests` | - | File (test_generated.py) | Download generated test file |

### FastAPI Backend Routes (Port 8000)

| Method | Path | Request Body | Response | Description |
|--------|------|--------------|----------|-------------|
| POST | `/run-tests` | `{ test_code: string }` | `{ passed, failed, status }` | Execute pytest and save results |
| GET | `/coverage` | - | `{ coverage, functions_covered, functions_missing }` | Calculate code coverage |
| GET | `/health` | - | `{ status: "ok" }` | Health check |

## Architecture

```
Frontend (Next.js)
├── Pages: /upload, /generate, /results, /metrics, /execution
└── API Routes: /api/* → Call Gemini & FastAPI

Backend (FastAPI)
├── /run-tests → Execute pytest
├── /coverage → Calculate coverage
└── Directories: uploads/, generated_tests/, reports/
```

## File Structure

```
project-root/
├── app/api/
│   ├── upload/route.ts
│   ├── analyze/route.ts
│   ├── generate-tests/route.ts
│   ├── generate-userstory-tests/route.ts
│   ├── results/route.ts
│   └── download-tests/route.ts
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── uploads/
│   ├── generated_tests/
│   └── reports/
├── .env.local (create this with GEMINI_API_KEY)
└── dev.md (this file)
```

## Common Workflows

### Generate and Run Tests from Python File

1. POST `/api/upload` → Get file_name
2. POST `/api/analyze` → Understand code structure
3. POST `/api/generate-tests` → Get pytest code
4. POST `/run-tests` (FastAPI) → Execute tests
5. GET `/api/results` → View results
6. GET `/coverage` (FastAPI) → Check coverage

### Generate Tests from User Story

1. POST `/api/generate-userstory-tests` → Get test cases
2. Manual: Write pytest code from test cases
3. POST `/run-tests` (FastAPI) → Execute tests
4. GET `/api/results` → View results
