from datetime import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database_service import testgenai_database
from mvp_engine import analyze_python_file, extract_function_spans


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
UPLOADS_DIR = Path("/tmp/testgenai_uploads")
GENERATED_TESTS_DIR = Path("/tmp/testgenai_generated_tests")
REPORTS_DIR = Path("/tmp/testgenai_reports")
MANIFEST_PATH = GENERATED_TESTS_DIR / "manifest.json"
COVERAGE_JSON_PATH = REPORTS_DIR / "coverage.json"
RESULTS_PATH = REPORTS_DIR / "results.json"

# Resolve the venv Python explicitly relative to this file's directory.
# This avoids relying on sys.executable or PATH, which may point to the
# system Python (/usr/bin/python3) when the server is started without
# explicitly invoking venv/bin/python (e.g., bare `uvicorn` or `python`).
_VENV_PYTHON_CANDIDATES = [
    BASE_DIR / "venv" / "bin" / "python",
    BASE_DIR / "venv" / "bin" / "python3",
    BASE_DIR / ".venv" / "bin" / "python",
    BASE_DIR / ".venv" / "bin" / "python3",
]
VENV_PYTHON = next(
    (str(p) for p in _VENV_PYTHON_CANDIDATES if p.exists()),
    sys.executable,  # fallback: hope sys.executable is the right one
)


def ensure_directories() -> None:
    UPLOADS_DIR.mkdir(exist_ok=True)
    GENERATED_TESTS_DIR.mkdir(exist_ok=True)
    REPORTS_DIR.mkdir(exist_ok=True)


ensure_directories()


@app.on_event("startup")
def _log_interpreter_info() -> None:
    """Log which Python interpreter is running so venv issues are immediately visible."""
    print(f"[startup] sys.executable = {sys.executable}")
    print(f"[startup] sys.prefix     = {sys.prefix}")
    print(f"[startup] venv active    = {sys.prefix != sys.base_prefix}")


class GenerateTestsRequest(BaseModel):
    file_name: str


class RunTestsRequest(BaseModel):
    mode: str = "source-code"


class ExecutionLogEntry(BaseModel):
    timestamp: str
    level: str
    message: str


class ExecutionResultResponse(BaseModel):
    mode: str
    status: str
    generatedAt: str
    totalTests: int
    passedTests: int
    failedTests: int
    executionTime: str
    passRate: float
    logs: list[ExecutionLogEntry]


class CoverageByFile(BaseModel):
    fileName: str
    coveragePercent: float
    coveredFunctions: int
    missingFunctions: list[str]


class CoverageResponse(BaseModel):
    generatedAt: str
    coveragePercent: float
    functionsCovered: int
    functionsMissingCoverage: list[str]
    edgeCasesCovered: int
    summary: str
    byFile: list[CoverageByFile]


def load_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        raise HTTPException(status_code=404, detail="No generated tests found. Generate tests first.")
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def classify_log_level(message: str) -> str:
    if "FAILED" in message or "ERROR" in message:
        return "fail"
    if "PASSED" in message:
        return "pass"
    if "WARNING" in message or "WARN" in message:
        return "warn"
    return "info"


def parse_summary_count(pattern: str, output: str) -> int:
    match = re.search(pattern, output)
    return int(match.group(1)) if match else 0


def build_logs(output: str) -> list[ExecutionLogEntry]:
    timestamp = datetime.now().strftime("%H:%M:%S")
    logs: list[ExecutionLogEntry] = []
    for raw_line in output.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        logs.append(
            ExecutionLogEntry(
                timestamp=timestamp,
                level=classify_log_level(line),
                message=line,
            )
        )
    return logs


def resolve_source_coverage_entry(coverage_payload: dict, source_file_path: Path) -> tuple[str, dict]:
    source_file_resolved = str(source_file_path.resolve())
    files = coverage_payload.get("files", {})

    if source_file_resolved in files:
        return source_file_resolved, files[source_file_resolved]

    for file_key, file_value in files.items():
        if file_key.endswith(source_file_path.name):
            return file_key, file_value

    raise HTTPException(status_code=500, detail="Coverage output did not include the uploaded source file.")


def summarize_function_coverage(source_file_path: Path, missing_lines: set[int]) -> tuple[int, list[str]]:
    source_code = source_file_path.read_text(encoding="utf-8")
    spans = extract_function_spans(source_code)
    missing_functions: list[str] = []

    for span in spans:
        executed = any(line_number not in missing_lines for line_number in range(span["start_line"], span["end_line"] + 1))
        if not executed:
            missing_functions.append(span["name"])

    covered_count = max(len(spans) - len(missing_functions), 0)
    return covered_count, missing_functions


ENGINE_PATH = str(BASE_DIR / "mvp_engine.py")


@app.post("/generate-tests")
def generate_tests(request: GenerateTestsRequest):
    """Run mvp_engine.py to generate tests for a previously uploaded Python file."""
    file_path = UPLOADS_DIR / request.file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {request.file_name}")

    command = [
        VENV_PYTHON,
        ENGINE_PATH,
        "generate-tests",
        str(file_path),
        str(GENERATED_TESTS_DIR),
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(BASE_DIR),
        )
    except subprocess.TimeoutExpired as error:
        raise HTTPException(status_code=500, detail="Test generation timed out.") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Test generation failed: {error}") from error

    if result.returncode != 0:
        error_message = result.stderr.strip() or "Test generation failed."
        status_code = 404 if "File not found" in error_message else 500
        raise HTTPException(status_code=status_code, detail=error_message)

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=500, detail="mvp_engine returned invalid JSON.") from error

    testgenai_database.record_generated_tests(request.file_name, payload)
    return payload


@app.post("/run-tests", response_model=ExecutionResultResponse)
def run_tests(request: RunTestsRequest):
    if request.mode != "source-code":
        raise HTTPException(status_code=400, detail="Test execution is only available for source code mode in MVP.")

    manifest = load_manifest()

    unit_test_path = Path(manifest["unitTestFilePath"])
    edge_test_path = Path(manifest["edgeTestFilePath"])

    print(f"[run-tests] PID={os.getpid()} sys.executable={sys.executable} VENV_PYTHON={VENV_PYTHON}")
    command = [
        VENV_PYTHON,
        "-m",
        "pytest",
        str(unit_test_path),
        str(edge_test_path),
        "-v",
        "--tb=short",
    ]

    started = time.perf_counter()
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=60,
            cwd=str(BASE_DIR),
        )
    except subprocess.TimeoutExpired as error:
        raise HTTPException(status_code=500, detail="Test execution timed out.") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Test execution failed: {error}") from error

    duration = time.perf_counter() - started
    output = f"{result.stdout}\n{result.stderr}".strip()
    collected = parse_summary_count(r"collected\s+(\d+)\s+items", output)
    passed = parse_summary_count(r"(\d+)\s+passed", output)
    failed = parse_summary_count(r"(\d+)\s+failed", output)
    total = collected or (passed + failed)

    payload = ExecutionResultResponse(
        mode="source-code",
        status="completed" if result.returncode in (0, 1) else "failed",
        generatedAt=datetime.utcnow().isoformat() + "Z",
        totalTests=total,
        passedTests=passed,
        failedTests=failed,
        executionTime=f"{duration:.2f}s",
        passRate=round((passed / total) * 100, 1) if total else 0,
        logs=build_logs(output),
    )

    payload_data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    RESULTS_PATH.write_text(json.dumps(payload_data, indent=2), encoding="utf-8")
    testgenai_database.record_execution(str(manifest.get("sourceFileName", "")), payload_data)
    return payload


@app.get("/coverage", response_model=CoverageResponse)
def get_coverage():
    manifest = load_manifest()

    source_file_path = Path(manifest["sourceFilePath"])
    unit_test_path = Path(manifest["unitTestFilePath"])
    edge_test_path = Path(manifest["edgeTestFilePath"])
    module_name = manifest["moduleName"]

    command = [
        VENV_PYTHON,
        "-m",
        "pytest",
        str(unit_test_path),
        str(edge_test_path),
        f"--cov={module_name}",
        f"--cov-report=json:{str(COVERAGE_JSON_PATH)}",
        "--cov-report=term-missing",
        "-q",
    ]

    try:
        subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=60,
            cwd=str(BASE_DIR),
            check=False,
        )
    except subprocess.TimeoutExpired as error:
        raise HTTPException(status_code=500, detail="Coverage run timed out.") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Coverage run failed: {error}") from error

    if not COVERAGE_JSON_PATH.exists():
        raise HTTPException(status_code=500, detail="Coverage report was not produced.")

    coverage_payload = json.loads(COVERAGE_JSON_PATH.read_text(encoding="utf-8"))
    _, source_entry = resolve_source_coverage_entry(coverage_payload, source_file_path)

    summary = source_entry.get("summary", {})
    missing_lines = set(source_entry.get("missing_lines", []))
    covered_functions, missing_functions = summarize_function_coverage(source_file_path, missing_lines)
    coverage_percent = round(float(summary.get("percent_covered", 0)), 1)
    total_functions = len(manifest.get("analysis", {}).get("functions", []))

    response = CoverageResponse(
        generatedAt=datetime.utcnow().isoformat() + "Z",
        coveragePercent=coverage_percent,
        functionsCovered=covered_functions,
        functionsMissingCoverage=missing_functions,
        edgeCasesCovered=int(manifest.get("summary", {}).get("edgeTestsGenerated", 0)),
        summary=(
            f"Coverage was calculated against {source_file_path.name}. "
            f"{covered_functions} of {total_functions} detected functions or methods received execution coverage."
        ),
        byFile=[
            CoverageByFile(
                fileName=source_file_path.name,
                coveragePercent=coverage_percent,
                coveredFunctions=covered_functions,
                missingFunctions=missing_functions,
            )
        ],
    )

    response_data = response.model_dump() if hasattr(response, "model_dump") else response.dict()
    testgenai_database.record_coverage(source_file_path.name, response_data)
    return response


@app.get("/results")
def get_results():
    """Return the last test execution results JSON."""
    if not RESULTS_PATH.exists():
        raise HTTPException(status_code=404, detail="No results yet. Run tests first.")
    return json.loads(RESULTS_PATH.read_text(encoding="utf-8"))


@app.get("/download-tests")
def download_tests():
    """Return the combined generated test file as a downloadable Python file."""
    from fastapi.responses import PlainTextResponse

    test_file = GENERATED_TESTS_DIR / "test_generated.py"
    if not test_file.exists():
        raise HTTPException(status_code=404, detail="No generated tests found. Generate tests first.")
    return PlainTextResponse(
        content=test_file.read_text(encoding="utf-8"),
        media_type="text/x-python",
        headers={"Content-Disposition": 'attachment; filename="test_generated.py"'},
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Accept a Python file upload and store it in UPLOADS_DIR."""
    if not file.filename or not file.filename.lower().endswith(".py"):
        raise HTTPException(status_code=400, detail="Only Python (.py) files are supported.")

    content = await file.read()
    file_size = len(content)
    dest = UPLOADS_DIR / file.filename
    dest.write_bytes(content)
    uploaded_at = datetime.utcnow().isoformat() + "Z"

    def fmt(b: int) -> str:
        if b < 1024:
            return f"{b} B"
        if b < 1024 * 1024:
            return f"{b / 1024:.1f} KB"
        return f"{b / (1024 * 1024):.1f} MB"

    testgenai_database.record_upload({
        "fileName": file.filename,
        "filePath": str(dest),
        "language": "Python",
        "fileSize": file_size,
        "repositoryName": "local-workspace",
        "sourceType": "local",
        "uploadedAt": uploaded_at,
    })

    return {
        "id": file.filename,
        "name": file.filename,
        "language": "Python",
        "sizeBytes": file_size,
        "sizeLabel": fmt(file_size),
        "status": "Uploaded",
        "uploadedAt": uploaded_at,
        "repository": "local-workspace",
        "source": "local",
    }


class AnalyzeRequest(BaseModel):
    file_name: str


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    """Run AST analysis on a previously uploaded Python file."""
    file_path = UPLOADS_DIR / request.file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {request.file_name}")

    try:
        payload = analyze_python_file(file_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    testgenai_database.record_analysis(request.file_name, payload)
    return payload


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
