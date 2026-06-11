from datetime import datetime
import json
from pathlib import Path
import re
import subprocess
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database_service import testgenai_database
from mvp_engine import extract_function_spans


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


def ensure_directories() -> None:
    UPLOADS_DIR.mkdir(exist_ok=True)
    GENERATED_TESTS_DIR.mkdir(exist_ok=True)
    REPORTS_DIR.mkdir(exist_ok=True)


ensure_directories()


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


@app.post("/run-tests", response_model=ExecutionResultResponse)
def run_tests(request: RunTestsRequest):
    if request.mode != "source-code":
        raise HTTPException(status_code=400, detail="Test execution is only available for source code mode in MVP.")

    manifest = load_manifest()

    unit_test_path = Path(manifest["unitTestFilePath"])
    edge_test_path = Path(manifest["edgeTestFilePath"])

    command = [
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


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
