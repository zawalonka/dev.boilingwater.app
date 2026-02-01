# Wiki Generator Usage

## Run (manual)
- `node wiki/src/index.js` (incremental)
- `node wiki/src/index.js --force` (full rebuild)

## Optional: Changed file optimization
- `node wiki/src/index.js --changed "src/data/substances/compounds/pure/water-h2o/info.json"`

## Environment
- `WIKI_BASE_PATH` (default: `/wiki`) for hosted path prefix
