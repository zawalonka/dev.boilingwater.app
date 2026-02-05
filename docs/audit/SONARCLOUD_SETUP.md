# SonarCloud Setup Instructions

## Quick Setup (5 minutes)

### Step 1: Sign Up & Import Project
1. Go to https://sonarcloud.io
2. Click "Log in" → "With GitHub"
3. Authorize SonarCloud
4. Click "+" → "Analyze new project"
5. Select "zawalonka/Boilingwater.app"
6. Click "Set Up"

### Step 2: Configure Analysis Method
1. Choose "With GitHub Actions"
2. Copy the `SONAR_TOKEN` shown
3. Go to GitHub repo → Settings → Secrets and variables → Actions
4. Click "New repository secret"
5. Name: `SONAR_TOKEN`
6. Value: [paste token from SonarCloud]
7. Click "Add secret"

### Step 3: Verify Configuration
The repository already has:
- ✅ `sonar-project.properties` (SonarCloud config)
- ✅ `.github/workflows/ci.yml` (includes SonarCloud job)

### Step 4: Trigger First Scan
1. Push commit or create PR
2. GitHub Actions runs automatically
3. Wait ~2-3 minutes for scan to complete
4. Check SonarCloud dashboard for results

## What SonarCloud Will Find

**Expected Initial Results:**
- **Technical Debt:** 20-30 hours (est.)
- **Code Smells:** 50-100 issues
- **Complexity Issues:** GameScene.jsx (complexity ~43, target <15)
- **Duplicated Code:** Some shared logic across components
- **Security:** Likely clean (no sensitive data handling yet)

**Quality Gate:**
- New code must pass quality standards
- Blocks merge if new issues introduced
- Auto-comments on pull requests

## Quality Badges

Badges are already added to README.md:
- Quality Gate Status (pass/fail)
- Technical Debt (hours to fix)
- Code Smells (count)
- Security Rating (A-E)
- Maintainability Rating (A-E)

## Next Steps After Setup

1. Review initial scan results on SonarCloud dashboard
2. Prioritize issues flagged as "High" or "Critical"
3. Fix issues gradually during refactoring (Weeks 2-8)
4. Watch technical debt decrease over time
5. Aim for Quality Gate: Pass before production release

## Troubleshooting

**Badge shows "unknown":**
- Wait for first scan to complete (2-3 min after push)
- Check GitHub Actions tab for CI status

**Scan fails:**
- Verify `SONAR_TOKEN` secret is set correctly
- Check `sonar-project.properties` for correct project key

**No data in SonarCloud:**
- Ensure CI workflow ran successfully
- Check GitHub Actions logs for errors

---

**Status:** Configuration complete, awaiting first scan  
**Setup Time:** ~5 minutes  
**First Scan:** Automatic on next push/PR
