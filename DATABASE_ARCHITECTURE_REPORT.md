# TESTGENAI Database Architecture Report

## Overview

TESTGENAI now has an additive Supabase PostgreSQL persistence layer for historical testing activity. The MVP upload, analysis, test generation, execution, coverage, report, OpenAI, and Gemini flows remain unchanged; database writes run as optional side effects and fail gracefully when Supabase is unavailable.

## Schema

Migration: `supabase/migrations/001_testgenai_analytics.sql`

Tables:

- `uploaded_files`: one historical row per upload, including file identity, source, repository, size, and completion flags.
- `analysis_results`: AST metadata and JSON snapshots for functions, classes, imports, and dependencies.
- `semantic_test_cases`: human-readable generated tests per function, including unit, negative, edge, boundary, and logic issue JSON.
- `generated_pytest_artifacts`: executable pytest files and their content.
- `executions`: execution summaries, pass/fail totals, pass rate, duration, and logs.
- `execution_details`: individual parsed test outcomes linked to an execution.
- `coverage_reports`: coverage percent, covered/missing functions, summary, and raw coverage JSON.
- `user_story_sessions`: generated user-story test suites and provider metadata.
- `project_metrics`: singleton aggregate row for future dashboards.

## Relationships

`uploaded_files` is the parent for source-code workflows. Analysis, semantic tests, pytest artifacts, executions, and coverage reports reference it through `uploaded_file_id` with cascading deletes. `execution_details` references `executions`. User-story sessions are independent because they do not require an uploaded file.

## Storage Strategy

Structured dashboard fields are stored as scalar columns for fast filtering and aggregation. Full result snapshots are stored in `jsonb` columns so future dashboards can inspect generated tests, logs, coverage payloads, business rules, and provider output without changing existing API contracts.

The app stores history rather than overwriting records. Repeated uploads, generations, and executions create separate rows, enabling trend analysis across 50, 100, 500, 1000, and more executions.

## Scalability Strategy

Indexes support the expected dashboard queries:

- Recent uploads and executions by timestamp.
- Per-file history lookup.
- Execution status filtering.
- Coverage and analysis history per file.
- Recent user-story sessions.

For 1000+ executions, the current schema remains practical because logs and generated artifacts live in append-only tables, while dashboard counters are cached in `project_metrics`. If usage grows further, the next production steps are partitioning `executions`/`coverage_reports` by month, moving large artifact content to Supabase Storage, and refreshing metrics through scheduled database functions or materialized views.

## Future Dashboard Readiness

The schema supports:

- Files tested: count `uploaded_files`.
- Tests generated: aggregate `generated_pytest_artifacts` or `semantic_test_cases`.
- Passed/failed tests: sum `executions.passed_tests` and `executions.failed_tests`.
- Average pass rate: average `executions.pass_rate`.
- Average coverage: average `coverage_reports.coverage_percent`.
- Most common failure: group `execution_details.failure_reason`.
- Most tested file: join `executions` to `uploaded_files` and group by file.
- Most recent execution: latest `executions.execution_timestamp`.
- Coverage trends: time-series over `coverage_reports.generated_at`.
- Provider usage and OpenAI vs Gemini comparison: group `semantic_test_cases` and `user_story_sessions` by `provider` and `model`.

## Application Integration

TypeScript data access lives under `database/`:

- `database/services/DatabaseService.ts`
- `database/services/TestGenAIDatabaseService.ts`
- `database/repositories/UploadRepository.ts`
- `database/repositories/AnalysisRepository.ts`
- `database/repositories/TestRepository.ts`
- `database/repositories/ExecutionRepository.ts`
- `database/repositories/CoverageRepository.ts`
- `database/repositories/UserStoryRepository.ts`
- `database/repositories/MetricsRepository.ts`

FastAPI coverage and execution persistence lives in `backend/database_service.py`.

All writes log structured JSON events and are intentionally fail-soft.
