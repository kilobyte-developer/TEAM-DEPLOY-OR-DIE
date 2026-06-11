# Team Leader — GitHub Secrets Setup

> Complete this **before** merging the CI/CD workflow PR.
> The workflow will silently fail or skip deploys if any secret is missing.

---

## Where to add secrets

1. Go to the **upstream repo** on GitHub (the original, not anyone's fork)
2. Click **Settings** tab (you need Admin access)
3. Left sidebar → **Secrets and variables** → **Actions**
4. Click **New repository secret** for each item below

---

## All secrets to add

### App secrets (from `.env.example`)

| Secret name | What it is | Where to get it |
|-------------|-----------|-----------------|
| `SUPABASE_URL` | Supabase project URL | Supabase dashboard → Project Settings → API → **Project URL** |
| `SUPABASE_ANON_KEY` | Supabase public anon key | Supabase dashboard → Project Settings → API → **anon public** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret server-side key | Supabase dashboard → Project Settings → API → **service_role** (keep private) |
| `OPENAI_API_KEY` | OpenAI API key | [platform.openai.com](https://platform.openai.com) → API keys → Create new |
| `GEMINI_API_KEY` | Google Gemini API key | [aistudio.google.com](https://aistudio.google.com) → Get API key |
| `FASTAPI_URL` | Production backend URL (server-side) | Your Render backend URL, e.g. `https://your-app.onrender.com` |
| `NEXT_PUBLIC_FASTAPI_URL` | Production backend URL (client-side) | Same as above |
| `LLM_PROVIDER_PRIORITY` | Which AI to use first | Set to either `openai` or `gemini` (optional — defaults to `openai`) |

### Vercel secrets (frontend deploy)

> See `.github/VERCEL-SETUP.md` for step-by-step instructions to get these.

| Secret name | What it is |
|-------------|-----------|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel org/team ID (from `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | Vercel project ID (from `.vercel/project.json`) |

### Render secrets (backend deploy)

| Secret name | What it is | Where to get it |
|-------------|-----------|-----------------|
| `RENDER_API_KEY` | Render account API key | Render dashboard → avatar → Account Settings → **API Keys** → Create |
| `RENDER_SERVICE_ID` | ID of the FastAPI service on Render | Open your Render service → look at the URL: `dashboard.render.com/web/srv-XXXXXXXX` — copy `srv-XXXXXXXX` |

---

## Step-by-step: how to add each secret

```
1. Open: https://github.com/<org>/<repo>/settings/secrets/actions
2. Click "New repository secret"
3. Name: paste the secret name exactly as shown above (case-sensitive)
4. Secret: paste the value
5. Click "Add secret"
6. Repeat for all secrets in the tables above
```

> ⚠️ Secret names are case-sensitive. `SUPABASE_URL` ≠ `supabase_url`.

---

## Checklist before merging the CI/CD PR

- [ ] `SUPABASE_URL` added
- [ ] `SUPABASE_ANON_KEY` added
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added
- [ ] `OPENAI_API_KEY` added
- [ ] `GEMINI_API_KEY` added
- [ ] `FASTAPI_URL` added
- [ ] `NEXT_PUBLIC_FASTAPI_URL` added
- [ ] `LLM_PROVIDER_PRIORITY` added (or skip — defaults to `openai`)
- [ ] `VERCEL_TOKEN` added
- [ ] `VERCEL_ORG_ID` added
- [ ] `VERCEL_PROJECT_ID` added
- [ ] `RENDER_API_KEY` added
- [ ] `RENDER_SERVICE_ID` added

Once all boxes are checked → merge the CI/CD workflow PR.

---

## What happens if you merge before this is done?

- PRs will still lint and build (fallback placeholders are set for fork PRs)
- But the **deploy jobs will fail** on push to main because Vercel/Render auth will be empty
- No data will go to Supabase from the deployed app

It won't break anything permanently — just fix the missing secret and push an empty commit to retrigger:
```bash
git commit --allow-empty -m "chore: retrigger deploy after secret fix"
git push origin main
```
