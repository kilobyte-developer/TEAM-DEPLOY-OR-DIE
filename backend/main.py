from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import json
import os
from pathlib import Path
import re

app = FastAPI()

# Enable CORS for Next.js frontend at http://localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory paths relative to backend/
BASE_DIR = Path(__file__).parent
UPLOADS_DIR = BASE_DIR / "uploads"
GENERATED_TESTS_DIR = BASE_DIR / "generated_tests"
REPORTS_DIR = BASE_DIR / "reports"


def ensure_directories():
    """Create required directories on startup."""
    UPLOADS_DIR.mkdir(exist_ok=True)
    GENERATED_TESTS_DIR.mkdir(exist_ok=True)
    REPORTS_DIR.mkdir(exist_ok=True)


# Create directories on startup
ensure_directories()


class RunTestsRequest(BaseModel):
    test_code: str


class RunTestsResponse(BaseModel):
    passed: int
    failed: int
    status: str


class CoverageResponse(BaseModel):
    coverage: float
    functions_covered: int
    functions_missing: int


@app.post("/run-tests", response_model=RunTestsResponse)
def run_tests(request: RunTestsRequest):
    """Execute pytest on the generated test file."""
    try:
        if not request.test_code or not request.test_code.strip():
            raise HTTPException(status_code=400, detail="test_code cannot be empty")

        # Write test code to file
        test_file_path = GENERATED_TESTS_DIR / "test_generated.py"
        with open(test_file_path, "w") as f:
            f.write(request.test_code)

        # Run pytest
        result = subprocess.run(
            ["pytest", str(test_file_path), "-v", "--tb=short"],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=str(BASE_DIR),
        )

        # Parse pytest output for passed/failed counts
        output = result.stdout + result.stderr
        passed = len(re.findall(r"PASSED", output))
        failed = len(re.findall(r"FAILED", output))

        # Determine status
        status = "completed"
        if result.returncode != 0 and failed == 0 and passed == 0:
            status = "error"

        # Write results to file
        results = {
            "tests_generated": passed + failed,
            "passed": passed,
            "failed": failed,
            "pass_rate": (
                int((passed / (passed + failed) * 100))
                if (passed + failed) > 0
                else 0
            ),
        }

        results_file = REPORTS_DIR / "results.json"
        with open(results_file, "w") as f:
            json.dump(results, f)

        return RunTestsResponse(passed=passed, failed=failed, status=status)

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Test execution timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test execution failed: {str(e)}")


@app.get("/coverage", response_model=CoverageResponse)
def get_coverage():
    """Calculate code coverage using pytest-cov."""
    try:
        test_file_path = GENERATED_TESTS_DIR / "test_generated.py"
        if not test_file_path.exists():
            raise HTTPException(status_code=404, detail="No generated tests found.")

        # Run pytest with coverage
        result = subprocess.run(
            [
                "pytest",
                str(test_file_path),
                "--cov=backend/generated_tests",
                "--cov-report=term-missing",
                "-v",
            ],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=str(BASE_DIR.parent),
        )

        output = result.stdout + result.stderr

        # Parse coverage percentage from TOTAL line
        # Format: TOTAL    20      5    75%
        total_match = re.search(r"TOTAL\s+(\d+)\s+(\d+)\s+(\d+)%", output)
        if not total_match:
            raise HTTPException(
                status_code=500,
                detail="Coverage run failed.",
            )

        total_lines = int(total_match.group(1))
        missing_lines = int(total_match.group(2))
        coverage = int(total_match.group(3))

        functions_covered = total_lines - missing_lines
        functions_missing = missing_lines

        return CoverageResponse(
            coverage=coverage,
            functions_covered=functions_covered,
            functions_missing=functions_missing,
        )

    except HTTPException:
        raise
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Coverage run failed.")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Coverage run failed.",
        )


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
