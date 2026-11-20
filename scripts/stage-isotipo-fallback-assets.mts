import { copyFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ISOTIPO_SLUGS } from '../lib/isotipos-catalog.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const SOURCE_DIR = path.join(REPO_ROOT, 'data/isotipos')
const DEST_DIR = path.join(REPO_ROOT, 'public/isotipos')

export async function stageIsotipoFallbackAssets(): Promise<number> {
  await rm(DEST_DIR, { recursive: true, force: true })
  await mkdir(DEST_DIR, { recursive: true })

  let staged = 0
  for (const slug of [...ISOTIPO_SLUGS].sort()) {
    const src = path.join(SOURCE_DIR, `${slug}.svg`)
    const dest = path.join(DEST_DIR, `${slug}.svg`)
    await copyFile(src, dest)
    staged += 1
  }

  console.log(`stage-isotipo-fallback-assets: staged ${staged} file(s) → public/isotipos/`)
  return staged
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isCli) {
  stageIsotipoFallbackAssets().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}