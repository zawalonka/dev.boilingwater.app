# Boiling Water Dev Repo Setup

This guide walks you through setting up the `dev.boilingwater.app` repository for staging/testing.

## Step 1: Create New GitHub Repository

1. Go to https://github.com/new
2. **Repository name:** `dev.boilingwater.app`
3. **Description:** "Development/staging environment for Boiling Water"
4. **Visibility:** Public (same as main repo)
5. **Initialize with:** Nothing (we'll push existing code)
6. Click **Create repository**

## Step 2: Push Current Code to Dev Repo

In your local project directory:

```bash
# Add the new dev repo as a remote
git remote add dev https://github.com/YOUR_USERNAME/dev.boilingwater.app.git

# Push current code to dev repo
git push dev main:main
```

Or, if starting completely fresh in the dev repo:

```bash
cd /path/to/new/dev/folder
git clone https://github.com/YOUR_USERNAME/dev.boilingwater.app.git
cd dev.boilingwater.app
# Copy all files from original repo here
git add .
git commit -m "Initial dev setup"
git push origin main
```

## Step 3: Configure GitHub Pages

1. Go to https://github.com/YOUR_USERNAME/dev.boilingwater.app/settings/pages
2. **Source:** GitHub Actions (already selected by workflow)
3. **Custom domain:** `dev.boilingwater.app`
4. Save

## Step 4: Update DNS at Porkbun

1. Log in to Porkbun
2. Go to DNS management for `boilingwater.app`
3. Add a new CNAME record:
   - **Name:** `dev`
   - **Type:** CNAME
   - **Value:** `YOUR_USERNAME.github.io`
   - **TTL:** 3600 (or default)
4. Save

DNS may take 30 mins to propagate.

## Step 5: Verify Deployment

1. Push a small change to dev repo main branch
2. Go to Actions tab—watch the workflow run
3. When done, visit https://dev.boilingwater.app
4. Should see your latest build live

## Workflow

From now on:
- **Develop:** Push to `dev.boilingwater.app` main → auto-deploys to dev.boilingwater.app
- **When ready:** Copy approved changes back to `boilingwater.app` → push to prod

Happy testing!
