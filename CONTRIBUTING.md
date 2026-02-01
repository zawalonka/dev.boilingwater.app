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
