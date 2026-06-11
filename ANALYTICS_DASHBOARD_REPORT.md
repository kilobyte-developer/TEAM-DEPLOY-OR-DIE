# TESTGENAI Analytics Dashboard Report

## Architecture

The Analytics Dashboard is a new additive management view at `/dashboard`.

- UI: `components/views/analytics-dashboard-view.tsx`
- Route: `app/dashboard/page.tsx`
- API: `GET /api/dashboard`
- Repository: `database/repositories/DashboardRepository.ts`
- Service: `database/services/AnalyticsService.ts`
- Client helper: `getAnalyticsDashboard()` in `lib/services/testgenai.ts`

The existing Overview page at `/` remains unchanged.

## Metrics

Top KPI cards are computed from Supabase:

- Total Files Uploaded: `uploaded_files`
- Total Executions: `executions`
- Total Tests Generated: `semantic_test_cases` plus `user_story_sessions`
- Total Tests Passed: `executions.passed_tests`
- Total Tests Failed: `executions.failed_tests`
- Average Pass Rate: `executions.pass_rate`
- Average Coverage: latest per-file `coverage_reports.coverage_percent`
- User Stories Processed: `user_story_sessions`
- Logic Issues Detected: `semantic_test_cases.potential_logic_issues_json`

## Charts

Charts use the existing Recharts dependency and `components/ui/chart.tsx`.

- Pass vs Fail: execution pass/fail totals.
- Coverage Trend: coverage percent by coverage generation date.
- Executions Over Time: daily execution count.
- Provider Usage: OpenAI, Gemini, and Local counts from semantic tests and user story sessions.
- Logic Issues Trend: daily logic issue count.

## Data Sources

Supabase tables used:

- `uploaded_files`
- `executions`
- `coverage_reports`
- `semantic_test_cases`
- `analysis_results`
- `user_story_sessions`
- `project_metrics`

The dashboard does not use mock data, local storage, or in-memory workflow state.

## Insights

The insights section calculates:

- Most Tested File
- Highest Coverage File
- Lowest Coverage File
- Best Pass Rate
- Worst Pass Rate
- Most Recent Execution
- Total Historical Coverage Average
- Functions Analyzed

The leaderboard displays the top 10 most tested files by execution count.

## Activity Feed

Recent Activity is reconstructed from Supabase timestamps:

- File uploaded
- Tests generated
- Execution completed
- Coverage generated
- User story processed

Items are sorted newest first.

## Performance Considerations

- API responses are aggregated server-side.
- Queries select only required columns.
- Default limits bound dashboard reads for large MVP datasets.
- Expensive detail payloads are not loaded into dashboard views.
- Timestamp indexes from the migration support the core sort patterns.

Future scaling options:

- Add database views/materialized views for daily aggregates.
- Add RPC functions for pass/fail and provider rollups.
- Paginate historical records beyond 1000 rows.
- Store generated HTML reports in Supabase Storage for immutable downloads.
- Track provider/model directly on executions if multiple execution providers are introduced.

## Manual Testing Checklist

1. Add records through the existing upload, analysis, test generation, execution, and coverage flows.
2. Verify dashboard KPI cards match Supabase data.
3. Verify Pass vs Fail chart uses execution totals.
4. Verify Coverage Trend updates after coverage generation.
5. Verify Executions Over Time groups executions by day.
6. Verify Provider Usage counts OpenAI, Gemini, and Local records.
7. Verify Logic Issues Trend reflects semantic issue records.
8. Verify leaderboard ranks the top 10 most tested files.
9. Verify Recent Activity survives browser refresh.
10. Verify empty database and Supabase errors show safe empty/error states.
