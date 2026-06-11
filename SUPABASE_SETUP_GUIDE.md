# Supabase Setup Guide

## 1. Create Supabase Project

Go to Supabase, create a new project, choose a region close to your users, and wait for the database to finish provisioning.

## 2. Obtain Keys

Open Project Settings > API and copy:

- Project URL
- anon public key
- service_role key

Keep the service role key private. It should only be used by server-side code.

## 3. Configure `.env`

Create `.env` from `.env.example` and fill in:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
FASTAPI_URL=http://127.0.0.1:8000
NEXT_PUBLIC_FASTAPI_URL=http://127.0.0.1:8000
```

Restart Next.js and FastAPI after changing environment variables.

## 4. Run Migrations

In Supabase SQL Editor, open `supabase/migrations/001_testgenai_analytics.sql`, paste the full script, and run it.

Alternatively, with the Supabase CLI configured:

```bash
supabase db push
```

## 5. Verify Connection

Start the app and upload a Python file. Server logs should include structured database messages such as:

```json
{"scope":"database","event":"connected"}
{"scope":"database","event":"record_inserted","table":"uploaded_files","count":1}
```

If environment variables are missing, the app logs `database disabled` and continues running normally.

## 6. Test Insertion

Run the normal workflow:

1. Upload a Python file.
2. Analyze it.
3. Generate tests.
4. Execute tests.
5. Refresh coverage.
6. Generate a user-story suite.

Then confirm rows exist in:

- `uploaded_files`
- `analysis_results`
- `semantic_test_cases`
- `generated_pytest_artifacts`
- `executions`
- `execution_details`
- `coverage_reports`
- `user_story_sessions`
- `project_metrics`

## 7. Troubleshooting

If no rows appear, check that `.env` is loaded by both Next.js and FastAPI.

If Supabase returns authentication errors, verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

If writes time out, check network access and Supabase project status.

If references are missing, upload the file again before running analysis or execution; persistence links later events to the latest uploaded row by file name.

If duplicate rows appear, that is expected for historical activity. Each retry or rerun is stored as a separate event.
