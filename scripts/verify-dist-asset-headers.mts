import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITEMAP_CACHE_CONTROL } from './generate-asset-headers.mts'

const distHeadersPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dist/client/_headers',
)

async function main() {
  const content = await readFile(distHeadersPath, 'utf8')
  if (!content.includes('/sitemap.xml')) {
    throw new Error(`${distHeadersPath} missing /sitemap.xml rule`)
  }
  if (!content.includes(SITEMAP_CACHE_CONTROL)) {
    throw new Error(
      `${distHeadersPath} missing sitemap Cache-Control parity (${SITEMAP_CACHE_CONTROL})`,
    )
  }
  if (!content.includes('/_astro/')) {
    throw new Error(`${distHeadersPath} missing Astro /_astro/* immutable rule`)
  }
  console.log(`dist/client/_headers OK`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
