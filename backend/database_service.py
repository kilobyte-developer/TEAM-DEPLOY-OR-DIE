import json
import os
import urllib.parse
import urllib.request
from typing import Any


METRICS_ID = "00000000-0000-0000-0000-000000000001"


def database_log(event: str, **details: Any) -> None:
    print(json.dumps({"scope": "database", "event": event, **details}))


class DatabaseService:
    def __init__(self) -> None:
        self.url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or ""
        self.enabled = bool(self.url and self.key)
        database_log(
            "connected" if self.enabled else "disabled",
            reason=None if self.enabled else "Supabase environment variables are not configured.",
        )

    def request(
        self,
        table: str,
        method: str = "GET",
        query: dict[str, str] | None = None,
        body: Any | None = None,
    ) -> Any | None:
        if not self.enabled:
            return None

        encoded_query = urllib.parse.urlencode(query or {})
        endpoint = f"{self.url}/rest/v1/{table}"
        if encoded_query:
            endpoint = f"{endpoint}?{encoded_query}"

        data = None if body is None else json.dumps(body).encode("utf-8")
        request = urllib.request.Request(
            endpoint,
            data=data,
            method=method,
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
        )

        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                payload = response.read().decode("utf-8")
                return json.loads(payload) if payload else None
        except Exception as error:
            database_log("error", table=table, method=method, message=str(error))
            return None

    def select(self, table: str, query: dict[str, str] | None = None) -> list[dict[str, Any]]:
        response = self.request(table, query=query)
        return response if isinstance(response, list) else []

    def insert(self, table: str, record: dict[str, Any] | list[dict[str, Any]]) -> dict[str, Any] | None:
        response = self.request(table, method="POST", body=record)
        if response is not None:
            database_log("record_inserted", table=table, count=len(record) if isinstance(record, list) else 1)
        return response[0] if isinstance(response, list) and response else None

    def update(self, table: str, filters: dict[str, str], patch: dict[str, Any]) -> None:
        query = {key: f"eq.{value}" for key, value in filters.items()}
        response = self.request(table, method="PATCH", query=query, body=patch)
        if response is not None:
            database_log("record_updated", table=table)


class TestGenAIDatabaseService:
    def __init__(self) -> None:
        self.db = DatabaseService()

    def find_latest_file(self, file_name: str) -> dict[str, Any] | None:
        rows = self.db.select(
            "uploaded_files",
            {
                "select": "*",
                "file_name": f"eq.{file_name}",
                "order": "upload_timestamp.desc",
                "limit": "1",
            },
        )
        return rows[0] if rows else None

    def record_upload(self, upload: dict[str, Any]) -> None:
        """Persist an upload event to Supabase (no-op if DB is disabled)."""
        try:
            self.db.insert(
                "uploaded_files",
                {
                    "file_name": upload.get("fileName"),
                    "file_path": upload.get("filePath"),
                    "language": upload.get("language", "Python"),
                    "file_size": upload.get("fileSize"),
                    "upload_timestamp": upload.get("uploadedAt"),
                    "repository_name": upload.get("repositoryName", "local-workspace"),
                    "source_type": upload.get("sourceType", "local"),
                },
            )
            self.refresh_metrics()
            database_log("upload_stored", file_name=upload.get("fileName"))
        except Exception as error:
            database_log("upload_store_failed", message=str(error))

    def record_analysis(self, file_name: str, analysis: dict[str, Any]) -> None:
        """Persist an analysis result to Supabase (no-op if DB is disabled)."""
        try:
            uploaded_file = self.find_latest_file(file_name)
            if not uploaded_file:
                return
            self.db.insert(
                "analysis_results",
                {
                    "uploaded_file_id": uploaded_file["id"],
                    "functions_json": analysis.get("functions", []),
                    "classes_json": analysis.get("classes", []),
                    "imports_json": analysis.get("imports", []),
                    "dependencies_json": analysis.get("dependencies", []),
                    "generated_at": analysis.get("generatedAt"),
                },
            )
            self.db.update("uploaded_files", {"id": uploaded_file["id"]}, {"analysis_completed": True})
            database_log("analysis_stored", uploaded_file_id=uploaded_file["id"])
        except Exception as error:
            database_log("analysis_store_failed", message=str(error))

    def record_generated_tests(self, file_name: str, tests: dict[str, Any]) -> None:
        """Persist generated test results to Supabase (no-op if DB is disabled)."""
        try:
            uploaded_file = self.find_latest_file(file_name)
            if not uploaded_file:
                return
            summary = tests.get("summary", {})
            self.db.insert(
                "generated_pytest_artifacts",
                {
                    "uploaded_file_id": uploaded_file["id"],
                    "unit_tests_count": summary.get("unitTestsGenerated", 0),
                    "edge_tests_count": summary.get("edgeTestsGenerated", 0),
                    "artifact_content": tests,
                    "generated_at": tests.get("generatedAt"),
                },
            )
            self.db.update("uploaded_files", {"id": uploaded_file["id"]}, {"tests_generated": True})
            self.refresh_metrics()
            database_log("generated_tests_stored", uploaded_file_id=uploaded_file["id"])
        except Exception as error:
            database_log("generated_tests_store_failed", message=str(error))

    def record_execution(self, file_name: str, execution: dict[str, Any]) -> None:
        try:
            uploaded_file = self.find_latest_file(file_name)
            if not uploaded_file:
                return

            row = self.db.insert(
                "executions",
                {
                    "uploaded_file_id": uploaded_file["id"],
                    "execution_timestamp": execution.get("generatedAt"),
                    "status": execution.get("status"),
                    "total_tests": execution.get("totalTests", 0),
                    "passed_tests": execution.get("passedTests", 0),
                    "failed_tests": execution.get("failedTests", 0),
                    "pass_rate": execution.get("passRate", 0),
                    "execution_time": execution.get("executionTime"),
                    "logs_json": execution.get("logs", []),
                },
            )
            if row and row.get("id"):
                details = self.execution_details(row["id"], execution.get("logs", []))
                if details:
                    self.db.insert("execution_details", details)
            self.db.update("uploaded_files", {"id": uploaded_file["id"]}, {"execution_completed": True})
            self.refresh_metrics()
            database_log("execution_stored", uploaded_file_id=uploaded_file["id"])
        except Exception as error:
            database_log("execution_store_failed", message=str(error))

    def record_coverage(self, file_name: str, coverage: dict[str, Any]) -> None:
        try:
            uploaded_file = self.find_latest_file(file_name)
            if not uploaded_file:
                return

            self.db.insert(
                "coverage_reports",
                {
                    "uploaded_file_id": uploaded_file["id"],
                    "coverage_percent": coverage.get("coveragePercent", 0),
                    "functions_covered": coverage.get("functionsCovered", 0),
                    "functions_missing": coverage.get("functionsMissingCoverage", []),
                    "coverage_summary": coverage.get("summary"),
                    "coverage_json": coverage,
                    "generated_at": coverage.get("generatedAt"),
                },
            )
            self.db.update("uploaded_files", {"id": uploaded_file["id"]}, {"coverage_completed": True})
            self.refresh_metrics()
            database_log("coverage_stored", uploaded_file_id=uploaded_file["id"])
        except Exception as error:
            database_log("coverage_store_failed", message=str(error))

    def refresh_metrics(self) -> None:
        if not self.db.enabled:
            return

        files = self.db.select("uploaded_files", {"select": "id"})
        executions = self.db.select(
            "executions",
            {"select": "passed_tests,failed_tests,pass_rate"},
        )
        artifacts = self.db.select("generated_pytest_artifacts", {"select": "artifact_content"})
        coverage = self.db.select("coverage_reports", {"select": "coverage_percent"})

        total_generated = sum(str(item.get("artifact_content", "")).count("\ndef test_") for item in artifacts)
        pass_rates = [float(item.get("pass_rate") or 0) for item in executions]
        coverage_rates = [float(item.get("coverage_percent") or 0) for item in coverage]

        self.db.update(
            "project_metrics",
            {"id": METRICS_ID},
            {
                "total_uploaded_files": len(files),
                "total_executions": len(executions),
                "total_tests_generated": total_generated,
                "total_tests_passed": sum(int(item.get("passed_tests") or 0) for item in executions),
                "total_tests_failed": sum(int(item.get("failed_tests") or 0) for item in executions),
                "average_pass_rate": round(sum(pass_rates) / len(pass_rates), 2) if pass_rates else 0,
                "average_coverage": round(sum(coverage_rates) / len(coverage_rates), 2) if coverage_rates else 0,
                "last_updated": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            },
        )

    @staticmethod
    def execution_details(execution_id: str, logs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        details: list[dict[str, Any]] = []
        for log in logs:
            message = str(log.get("message", ""))
            status = None
            if " PASSED" in message:
                status = "passed"
            elif " FAILED" in message:
                status = "failed"
            elif " ERROR" in message:
                status = "error"

            if not status or "::" not in message:
                continue

            test_name = message.split("::")[-1].split()[0]
            details.append(
                {
                    "execution_id": execution_id,
                    "test_name": test_name,
                    "status": status,
                    "actual_output": message,
                    "failure_reason": message if status in {"failed", "error"} else None,
                }
            )
        return details


testgenai_database = TestGenAIDatabaseService()
