# Contributing to Boiling Water

Thanks for your interest in contributing!

## Ways to Contribute
- Report bugs
- Suggest features or improvements
- Submit pull requests
- Improve documentation or educational content

## Before You Start
- Check existing issues and discussions to avoid duplicates.
- For major changes, open an issue first to discuss scope and approach.

### ⚠️ Important: AI-Assisted Development Workflow

**This codebase is developed primarily through rapid AI-assisted coding sessions.** Before investing significant time in a pull request, please consider:

**Open an Issue First (Strongly Recommended):**
- Discuss the change with the maintainer before implementing
- The maintainer can address most issues quickly with AI assistance
- This avoids duplicate work and ensures changes align with project direction

**Risk of Manual Contributions:**
- Manual code changes may be overwritten in future AI coding sessions
- The AI may regenerate sections without awareness of manual edits
- Your excellent contributions could be lost unintentionally

**Best Approach:**
1. Open a GitHub Issue describing the problem or feature
2. Wait for maintainer response and discussion
3. If maintainer approves external PR → proceed with implementation
4. If maintainer prefers to handle → they'll address it with AI assistance

**This isn't a rejection of contributions** — it's protecting your time and ensuring changes are preserved in the AI-assisted workflow. Issue reports and feature requests are always welcome!

## Development Setup (Quick)
1. Install dependencies
   - `npm install`
2. Start the dev server
   - `npm run dev`

## Code Style
- Keep changes focused and minimal.
- Match existing formatting and patterns.
- Avoid unrelated refactors in the same PR.

## Physics & Educational Accuracy
This project uses real thermodynamics equations and data. Please:
- Avoid arbitrary clamps or Earth-only limits in physics calculations.
- Prefer direct equation evaluation and return metadata when extrapolating.
- Preserve scientific accuracy when updating educational content.

## Substances & Data Files
- Follow the templates in the docs guides:
  - `docs/guides/SUBSTANCE_FILE_TEMPLATE.md`
  - `docs/guides/SUBSTANCE_SYSTEM_GUIDE.md`
- Ensure units and references are correct.

## Testing
- Run the app and verify basic functionality.
- Test workshop switching (common failure point).

## Dev vs Production
- Changes should be pushed to the dev remote first (`git push dev main`).
- Do not push directly to production (`origin`) without explicit approval.

## Pull Requests
- Describe what you changed and why.
- Include screenshots for UI changes when relevant.
- Make sure the app builds and runs locally.

## License
By contributing, you agree that your contributions will be licensed under the project’s existing licenses.
