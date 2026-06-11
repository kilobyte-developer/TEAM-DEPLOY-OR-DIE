# CI / CD Guide

## What the pipeline does

```
Every PR → frontend-checks + backend-checks run in parallel
               │
               └─ Both must be green before the PR can merge

Push to main → frontend-checks + backend-checks run first
                        │
               (both green) ─┬─ deploy-frontend → Vercel
                              └─ deploy-backend  → Render
```

### Job breakdown

| Job | Trigger | What it does |
|-----|---------|--------------|
| `frontend-checks` | PR + push to main | `pnpm install` → `pnpm lint` → `pnpm build` |
| `backend-checks` | PR + push to main | `pip install` → `pytest` with coverage |
| `deploy-frontend` | push to main only | Vercel CLI prod deploy (waits for both checks) |
| `deploy-backend` | push to main only | Render API deploy trigger (waits for both checks) |

---

## Required secrets

Add every secret below to **GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret**.

### App secrets (from `.env.example`)

| Secret name | Where to get it | Required? |
|-------------|-----------------|-----------|
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → anon public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → service_role key | Yes |
| `OPENAI_API_KEY` | platform.openai.com → API keys | Yes (if using OpenAI for user-story generation) |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key | Yes (if using Gemini for user-story generation) |
| `NEXT_PUBLIC_FASTAPI_URL` | Your Render backend URL, e.g. `https://your-app.onrender.com` | Yes |
| `FASTAPI_URL` | Same as above (server-side Next.js routes use this) | Yes |
| `LLM_PROVIDER_PRIORITY` | Either `openai` or `gemini` (defaults to `openai` if omitted) | Optional |

### Deployment secrets (infra)

| Secret name | Where to get it |
|-------------|-----------------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Run `vercel link` locally, then read `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | Same file → `projectId` |
| `RENDER_API_KEY` | Render dashboard → Account Settings → API Keys |
| `RENDER_SERVICE_ID` | Your Render service URL: `https://dashboard.render.com/web/srv-XXXXXXXX` — the `srv-XXXXXXXX` part |

---

## How to add secrets in GitHub

1. Go to your repo on github.com
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the name exactly as shown in the table above (case-sensitive)
5. Paste the value and click **Add secret**
6. Repeat for each secret

---

## What happens when a job fails

| Failure | Effect |
|---------|--------|
| `frontend-checks` fails on a PR | PR is blocked; deploy jobs never run |
| `backend-checks` fails on a PR | PR is blocked; deploy jobs never run |
| Either check fails on push to main | Both deploy jobs are skipped automatically |
| `deploy-frontend` fails | `deploy-backend` still runs (they are parallel after checks) |
| `deploy-backend` fails | `deploy-frontend` still runs |

To fix: push a new commit to the branch/main — the workflow retriggers automatically.

---

## How to trigger a manual redeploy

### Via GitHub UI
1. Go to **Actions** tab → select the **CI / CD** workflow
2. There is no manual dispatch configured — push an empty commit instead:
   ```bash
   git commit --allow-empty -m "chore: retrigger deploy"
   git push origin main
   ```

### Via Render (backend only)
```bash
curl --silent --request POST \
  --header "Authorization: Bearer <RENDER_API_KEY>" \
  --header "Accept: application/json" \
  "https://api.render.com/v1/services/<RENDER_SERVICE_ID>/deploys" \
  --data '{}'
```

### Via Vercel (frontend only)
```bash
vercel deploy --prebuilt --prod --token=<VERCEL_TOKEN>
```

Or click **Redeploy** on the latest deployment in the Vercel dashboard.

---

## Optional: add `workflow_dispatch` for one-click redeploy

Add this to the `on:` block in `ci.yml` to enable a manual trigger button in the Actions tab:

```yaml
on:
  workflow_dispatch:   # ← add this line
  pull_request:
    branches: [main]
  push:
    branches: [main]
```
