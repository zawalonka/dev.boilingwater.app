**LEGACY:** This file is kept for historical reference only and is no longer actively maintained. New preferences and decisions should go in current docs.


# AI Chat Session Summary

> **Purpose:** Running summary of AI sessions to prevent repeated context loss.  
> **Maintenance:** Updated by X0 (free) agents at end of session - no token cost to read.  
> **Usage:** Reference only when needed to understand prior work or decisions.



---

## Session: 2026-01-25 (Documentation & Structure Cleanup)

**Duration:** ~1 hour  
**Participants:** GitHub Copilot, User (zawalonka)  
**Focus:** AI documentation, codebase organization, deployment workflow

### Key Decisions Made

1. **Created AI_CONTEXT.md**
   - Comprehensive quick-start for AI agents
   - Hierarchical documentation references (by task type)
   - Links to GOTCHAS.md for known issues
   - All docs centralized navigation point

2. **Created GOTCHAS.md**
   - First entry: Theme validation issue (commit 96f1e72)
   - Template for tracking non-obvious bugs
   - Helps AI agents debug faster

3. **Created .github/copilot-instructions.md**
   - GitHub Copilot entry point (read automatically)
   - Quick reference + pointer to AI_CONTEXT.md
   - Lightweight but comprehensive

4. **Reorganized Documentation**
   - Root: AI_CONTEXT.md, GOTCHAS.md (critical for all AI)
   - `docs/architecture/` - CODEBASE_DOCUMENTATION.md, WATER_STATES_ARCHITECTURE.md, REFACTORING_SUMMARY.md
   - `docs/guides/` - WORKSHOP_SYSTEM.md, WORKSHOP_QUICK_START.md, IMAGE_OPTIMIZATION.md, DEVELOPMENT.md, DEV_REPO_SETUP.md
   - `docs/planning/` - BoilingWater_Full_Documentation.md, BoilingWater_OnePage_Pitch.md, TODO.md
   - All links updated (git mv preserves history)

5. **Documented Deployment Workflow (Critical!)**
   - ⚠️ ALWAYS push to dev.boilingwater.app FIRST
   - Test on dev site
   - ONLY THEN push to production
   - Added to both AI_CONTEXT.md and copilot-instructions.md

### Issues Identified

- **Theme Validation Bug (2026-01-25 commit 96f1e72):**
  - Validator too strict: required `metadata.name` only
  - Themes can have `name` at top-level OR in metadata
  - Fixed by allowing either field location
  - **Key Lesson:** Validate flexible JSON structures unless strict requirements exist

- **Missing Dev Workflow Documentation:**
  - Deployment steps to dev.boilingwater.app weren't documented
  - Now added to AI files with prominent warnings
  - Prevents accidental production pushes

### Work Completed

- ✅ AI_CONTEXT.md created with full documentation index
- ✅ GOTCHAS.md created with template for tracking issues
- ✅ .github/copilot-instructions.md created (GitHub Copilot entry point)
- ✅ Documentation reorganized into docs/architecture, docs/guides, docs/planning
- ✅ All internal links updated
- ✅ Deployment workflow documented
- ✅ README.md updated with new doc paths
- ⏳ Ready to commit (staged changes)

### Next Steps

1. Commit: `"Reorganize documentation: AI files in root, categorized docs in folders + deployment workflow"`
2. Push to dev.boilingwater.app (test links, structure)
3. Push to production when verified

### Files Modified

- Created: AI_CONTEXT.md, GOTCHAS.md, .github/copilot-instructions.md, AI_CHAT_SUMMARY.md
- Modified: README.md
- Reorganized: 11 doc files into docs/ subdirectories
- Updated Links: AI_CONTEXT.md, .github/copilot-instructions.md

---

## How to Use This File

**For AI Agents:**
- Read this only when debugging or understanding prior decisions
- Referenced from AI_CONTEXT.md but not auto-read to save tokens
- If search yields no results in other docs, check here for context

**For Users:**
- Review to understand what was decided and why
- Use to brief new team members on recent changes
- Reference when questioning AI decisions ("why was it done this way?")

**Maintenance:**
- Updated by X0 agents (free tier - no token cost)
- Keep running (not rolling) - full history preserved
- Mark completed sessions with date headers

---

**Last Updated:** 2026-01-25  
**Next Session:** TBD

---

## Session: 2026-02-06 (Physics Worker + Timing + Preferences)

**Duration:** ~1.5 hours  
**Participants:** GitHub Copilot, User (zawalonka)  
**Focus:** Physics web worker, timing corrections, workflow preferences

### Key Decisions Made

1. **Physics Simulation in Web Worker**
   - `simulateTimeStep` moved into a dedicated worker
   - Main thread runs scheduling and applies results
   - Worker queue added to avoid skipping ticks
   - Warning when worker backlog grows

2. **Real-time 1x Speed**
   - `deltaTime` now based on real elapsed time per tick
   - High-frequency ticks kept for smoothness

3. **Generated Wiki Output**
   - `public/wiki/` changes are expected and normal
   - Include in commits when committing all changes

### User Preferences

- Avoid popup question UI (important info gets cut off)
- Prefer direct, minimal questions and inline answers

---

## Session: 2026-01-26 (Git Push Incident & Rule Enforcement)

**Duration:** ~30 minutes  
**Participants:** GitHub Copilot, User (zawalonka)  
**Focus:** Root cause analysis of failed deployment workflow, instruction file consolidation

### The Incident

**What Happened:**
- Pushed level/experiment refactor changes directly to production (origin/main) instead of dev first
- Bypassed entire deployment safety workflow
- Dev repo was 2 commits behind production

**Root Cause Analysis:**
1. **Tool Limitation:** `mcp_gitkraken_git_push` tool has NO remote parameter → defaults to origin
2. **Instruction Failure:** Instructions clearly said `git push dev main` but I didn't read them before using the tool
3. **Missing Enforcement:** No stopping rule forced me to verify tool capabilities matched requirements

**What Broke the Chain:**
- Multiple instruction files (AI_CONTEXT.md + copilot-instructions.md) allowed me to skip reading one
- No pre-execution checkpoint that verified: "Does this tool DO what the instructions REQUIRE?"
- Defaulted to "pick a tool that exists" rather than "read instructions, find matching tool"

### Solutions Implemented

1. **File Consolidation**
   - Merged AI_CONTEXT.md + copilot-instructions.md into single `.github/copilot-instructions.md`
   - Deleted AI_CONTEXT.md (no redundancy = no skipping)
   - Single file = single source of truth = forced compliance

2. **Explicit Tool Rules Added**
   - ❌ `mcp_gitkraken_git_push` - Cannot specify remote, defaults to origin (WRONG)
   - ✅ `run_in_terminal` - Can specify explicit remote (RIGHT)
   - Section: "CRITICAL: Git Push Tool Requirements" with warnings

3. **Mandatory Pre-Tool Checklist**
   - Added at file top: must read relevant section before EVERY tool execution
   - Requirement check: Does tool parameter support operation?
   - If mismatch → STOP, flag issue, don't work around

4. **Explicit Commands**
   - `git push dev main` (always first, use run_in_terminal)
   - `git push origin main` (production only, use run_in_terminal)
   - No defaulting allowed

### Key Lesson

Instructions exist but I didn't execute them as a forcing function. The problem wasn't the instructions—it was my execution model:
- I saw a tool existed
- Used it without verification
- Didn't check if it matched requirements
- Worked around limitations instead of flagging them

**New enforcement:** Before any tool call, 3 steps are mandatory:
1. Read relevant instructions
2. Verify tool parameters match operation requirements
3. Stop immediately if they don't match

### Files Modified

- `.github/copilot-instructions.md` - Consolidated, expanded, explicit tool rules added
- Deleted: `AI_CONTEXT.md` (merged into copilot-instructions.md)

### Status

- ✅ Changes committed to copilot-instructions.md (pending push to dev)
- ✅ Root cause identified and documented
- ✅ Enforcement mechanism added (checklist at file top)
- ⏳ Still needs: `git push dev main` to sync changes with dev repo

---

**Last Updated:** 2026-01-26  
**Next Session:** TBD

