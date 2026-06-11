# TESTGENAI Past Records Feature Report

## Architecture

The Past Records feature is additive and reads historical execution records from Supabase through the existing repository pattern.

- UI: `components/views/past-records-view.tsx`
- Route: `app/history/page.tsx`
- API:
  - `GET /api/history`
  - `GET /api/history/[id]`
  - `DELETE /api/history`
- Repository: `database/repositories/HistoryRepository.ts`
- Shared client service helpers: `lib/services/testgenai.ts`

Existing upload, analysis, generation, execution, coverage, provider, and report flows are not modified.

## Queries

The table view loads newest executions first from `executions`, then resolves related uploaded file metadata and latest coverage.

Primary tables:

- `executions`
- `uploaded_files`
- `coverage_reports`

The details view fetches one execution and related data:

- `uploaded_files`
- `analysis_results`
- `semantic_test_cases`
- `coverage_reports`
- `execution_details`

Queries select only the columns needed for each view and use indexed timestamp ordering already defined in the migration.

## UI Flow

1. User opens `Past Records` from the sidebar.
2. Page loads execution records from Supabase.
3. Records render in a newest-first table.
4. Search filters by file name.
5. Clicking a row opens a themed details modal.
6. Details modal shows metadata, analysis summary, semantic tests, logic issues, execution summary, coverage, logs, and an HTML report download generated from the stored record.

## Delete Workflow

1. User clicks `Delete Records`.
2. Password modal requires the exact case-sensitive password.
3. If the password is incorrect, deletion is rejected.
4. If correct, user enters the number of records to delete.
5. Confirmation dialog states the permanent delete count.
6. API selects the oldest execution records first using `execution_timestamp.asc`.
7. Supabase deletes those execution rows, cascading `execution_details`.
8. Newest records remain.

## Performance Considerations

- Default history list is capped to 1000 execution rows.
- Detail data is loaded only after row click.
- Table search is client-side over the already-bounded result set.
- Supabase indexes on execution and upload timestamps support newest-first and oldest-first operations.
- Deletion uses a small ID selection before delete rather than loading full historical payloads.

## Manual Testing Checklist

1. Add records by uploading code, generating tests, running execution, and generating coverage.
2. Verify the Past Records table shows Supabase execution records.
3. Verify search filters records by file name.
4. Verify row click opens the full details view.
5. Verify delete password rejects incorrect values.
6. Verify delete count accepts only positive whole numbers.
7. Verify delete confirmation appears before final deletion.
8. Verify deleting N records removes the oldest N execution records.
9. Verify newest records remain after deletion.
10. Verify refresh persistence by reloading the browser and checking records remain.
