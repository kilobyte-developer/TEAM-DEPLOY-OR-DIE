# Vercel Setup — Get Your 3 Keys

You need 3 values from Vercel before adding them as GitHub secrets:
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

---

## Step 1 — Create a Vercel account (skip if you have one)

Go to [vercel.com](https://vercel.com) and sign up with GitHub.

---

## Step 2 — Get `VERCEL_TOKEN`

1. Log in to Vercel
2. Click your **avatar** (top-right corner)
3. Click **Account Settings**
4. Left sidebar → click **Tokens**
5. Click **Create**
6. Name it `github-actions` (or anything)
7. Set expiration to **No expiration** (so CI doesn't break mid-hackathon)
8. Click **Create Token**
9. **Copy it immediately** — Vercel only shows it once

---

## Step 3 — Get `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

You need to link your project to Vercel once from your local machine.

### Install Vercel CLI
```bash
npm install -g vercel
```

### Link the project
Run this from the root of the repository:
```bash
vercel link
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your personal account or team
- **Link to existing project?** → No (first time) or Yes if already created on Vercel dashboard
- **Project name?** → Enter a name (e.g. `team-deploy-or-die`)

### Read the generated file
After linking, open `.vercel/project.json` in the repo root:
```json
{
  "orgId": "team_XXXXXXXXXXXXXXXXXX",
  "projectId": "prj_XXXXXXXXXXXXXXXXXX"
}
```

- `orgId` → this is your `VERCEL_ORG_ID`
- `projectId` → this is your `VERCEL_PROJECT_ID`

> ⚠️ Do NOT commit `.vercel/project.json` — it should already be in `.gitignore`.
> These values are not sensitive on their own, but keep them out of the repo anyway.

### Alternative: get them from the Vercel dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. Go to **Settings** tab
4. Scroll down to find **Project ID**
5. Your **Team/Org ID** is in the URL: `vercel.com/teams/YOUR-ORG-ID/...`
   or under **Settings → General → Team ID**

---

## Summary

| Secret name | Where you got it |
|-------------|-----------------|
| `VERCEL_TOKEN` | Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

Once you have all three, hand them to the team leader along with the other secrets to add to the upstream repo.
