import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const distRoot = path.resolve(repoRoot, 'wiki', 'dist')
const publicWiki = path.resolve(repoRoot, 'public', 'wiki')

const sync = async () => {
  await fs.rm(publicWiki, { recursive: true, force: true })
  await fs.mkdir(publicWiki, { recursive: true })
  await fs.cp(distRoot, publicWiki, { recursive: true })
  console.log('Wiki: synced to public/wiki')
}

sync().catch((error) => {
  console.error('Wiki: sync failed', error)
  process.exitCode = 1
})
