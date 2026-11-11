import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function defaultDistClientHeadersPath(): string {
  return path.resolve(__dirname, '../dist/client/_headers')
}

export const SITEMAP_CACHE_CONTROL =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'

const GENERATED_MARKER = '# loguitos: sitemap cache (generate-asset-headers.mts)'

export function buildSitemapHeadersBlock(): string {
  return `${GENERATED_MARKER}
/sitemap.xml
  Cache-Control: ${SITEMAP_CACHE_CONTROL}
`
}

/** Merge sitemap cache rule into dist/client/_headers after `astro build` (Astro copies public/ earlier). */
export function mergeDistClientHeaders(existingContent: string | null): string {
  let base = (existingContent ?? '').trimEnd()
  const markerIdx = base.indexOf(GENERATED_MARKER)
  if (markerIdx >= 0) {
    base = base.slice(0, markerIdx).trimEnd()
  } else {
    const out: string[] = []
    let skipSitemapBlock = false
    for (const line of base.split('\n')) {
      if (line.trim() === '/sitemap.xml') {
        skipSitemapBlock = true
        continue
      }
      if (skipSitemapBlock) {
        if (line.trim() === '' || (line.length > 0 && !line.startsWith(' '))) {
          skipSitemapBlock = false
        } else {
          continue
        }
      }
      out.push(line)
    }
    base = out.join('\n').trimEnd()
  }
  const block = buildSitemapHeadersBlock().trimEnd()
  return base ? `${base}\n\n${block}\n` : `${block}\n`
}

export async function writeDistClientHeaders(
  distHeadersPath = defaultDistClientHeadersPath(),
  existingContent?: string | null,
): Promise<string> {
  let existing = existingContent ?? null
  if (existingContent === undefined) {
    try {
      existing = await readFile(distHeadersPath, 'utf8')
    } catch {
      existing = null
    }
  }
  const body = mergeDistClientHeaders(existing)
  await mkdir(path.dirname(distHeadersPath), { recursive: true })
  await writeFile(distHeadersPath, body, 'utf8')
  return distHeadersPath
}

async function main() {
  const written = await writeDistClientHeaders()
  console.log(`Wrote ${written}`)
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isCli) {
  main().catch((error) => {
    console.error('Failed to generate asset headers:', error)
    process.exitCode = 1
  })
}
