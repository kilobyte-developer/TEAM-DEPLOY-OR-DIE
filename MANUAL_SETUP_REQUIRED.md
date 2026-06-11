# Manual Setup Required

Step 1:
Create a Supabase project.

Step 2:
Copy the Supabase project URL.

Step 3:
Copy the Supabase anon key.

Step 4:
Copy the Supabase service role key and keep it private.

Step 5:
Create `.env` from `.env.example`.

Step 6:
Fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

Step 7:
Add `OPENAI_API_KEY` and `GEMINI_API_KEY` if you want provider-backed generation.

Step 8:
Confirm `FASTAPI_URL=http://127.0.0.1:8000` and `NEXT_PUBLIC_FASTAPI_URL=http://127.0.0.1:8000` for local development.

Step 9:
Run `supabase/migrations/001_testgenai_analytics.sql` in the Supabase SQL Editor.

Step 10:
Restart the Next.js app.

Step 11:
Restart the FastAPI backend.

Step 12:
Upload a Python file and verify a row appears in `uploaded_files`.

Step 13:
Run analyze, generate tests, execute tests, coverage, and user-story generation.

Step 14:
Verify historical rows are present in every analytics table.
