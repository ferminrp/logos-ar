/**
 * Download third-party catalog logo URLs into public/logos and point overrides at /logos/{slug}.png.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { listThirdPartyCatalogLogos } from '../lib/catalog-logo-hosting.ts'
import { getAllEntities } from '../lib/entity-index.ts'
import { getEntityLogoUrl } from '../lib/entity-logo.ts'
import { getGoogleFaviconUrl, getDuckDuckGoFaviconUrl } from '../lib/favicon-urls.ts'
import { MIN_LOGO_BYTES } from '../lib/logo-quality/constants.ts'
import { discoverSiteLogoUrls } from '../lib/logo-quality/site-logo.ts'
import { normalizeLogoForTile } from '../lib/logo-quality/normalize-tile-logo.ts'
import { analyzeLogoVisual, evaluateVisualAnalysis } from '../lib/logo-quality/visual-analysis.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const logosDir = path.join(repoRoot, 'public', 'logos')
const overridesPath = path.join(repoRoot, 'data', 'logo-overrides.json')
const reportPath = path.join(repoRoot, 'data', 'logo-host-migration-report.json')

async function fetchBytes(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LogosArgentina-CatalogHost/1.0' },
      signal: AbortSignal.timeout(25_000),
    })
    if (!response.ok) return null
    const buf = Buffer.from(await response.arrayBuffer())
    return buf.length > 0 ? buf : null
  } catch {
    return null
  }
}

function parseOnlySlugs(argv: string[]): Set<string> | null {
  const flag = argv.find((arg) => arg.startsWith('--only='))
  if (!flag) return null
  const slugs = flag
    .slice('--only='.length)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return slugs.length > 0 ? new Set(slugs) : null
}

function parseLimit(argv: string[]): number | null {
  const flag = argv.find((arg) => arg.startsWith('--limit='))
  if (!flag) return null
  const n = Number.parseInt(flag.slice('--limit='.length), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

async function candidateUrls(domain: string, primaryUrl: string): Promise<string[]> {
  const seen = new Set<string>()
  const out: string[] = []
  const push = (url: string) => {
    if (!url || seen.has(url)) return
    seen.add(url)
    out.push(url)
  }
  push(primaryUrl)
  for (const url of await discoverSiteLogoUrls(domain)) push(url)
  push(getGoogleFaviconUrl(domain, 256))
  push(getDuckDuckGoFaviconUrl(domain))
  return out
}

async function toHostedPng(bytes: Buffer): Promise<Buffer | null> {
  try {
    return await normalizeLogoForTile(bytes)
  } catch {
    try {
      return await sharp(bytes, { density: 220, failOn: 'none' })
        .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    } catch {
      return null
    }
  }
}

async function main() {
  const only = parseOnlySlugs(process.argv.slice(2))
  const limit = parseLimit(process.argv.slice(2))
  await mkdir(logosDir, { recursive: true })

  const entities = getAllEntities()
  let targets = listThirdPartyCatalogLogos(entities)
  if (only) targets = targets.filter((t) => only.has(t.slug))
  if (limit) targets = targets.slice(0, limit)

  const overrides = JSON.parse(await readFile(overridesPath, 'utf8')) as Record<
    string,
    { logoUrl: string; logoSource: string }
  >

  const migrated: string[] = []
  const failed: { slug: string; reason: string }[] = []

  for (const target of targets) {
    const entity = entities.find((e) => e.slug === target.slug)
    if (!entity) {
      failed.push({ slug: target.slug, reason: 'entity not found' })
      continue
    }

    const urls = await candidateUrls(entity.domain, getEntityLogoUrl(entity))
    let png: Buffer | null = null
    let sourceUrl = ''
    for (const url of urls) {
      const raw = await fetchBytes(url)
      if (!raw) continue
      png = await toHostedPng(raw)
      if (png && png.length >= MIN_LOGO_BYTES) {
        sourceUrl = url
        break
      }
    }

    if (!png || png.length < MIN_LOGO_BYTES) {
      failed.push({ slug: target.slug, reason: 'no fetchable source' })
      continue
    }

    const analysis = await analyzeLogoVisual(new Uint8Array(png))
    const visualIssues = analysis ? evaluateVisualAnalysis(analysis) : []
    const blockingVisual = visualIssues.filter((i) => i.code === 'generic-favicon')
    if (blockingVisual.length > 0) {
      failed.push({ slug: target.slug, reason: `quality: ${blockingVisual.map((i) => i.code).join(',')}` })
      continue
    }

    const fileName = `${entity.slug}.png`
    await writeFile(path.join(logosDir, fileName), png)
    overrides[entity.domain.toLowerCase()] = {
      logoUrl: `/logos/${fileName}`,
      logoSource: 'hosted',
    }
    migrated.push(entity.slug)
    console.log('hosted', entity.slug, sourceUrl.slice(0, 72))
  }

  await writeFile(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`)
  await writeFile(
    reportPath,
    `${JSON.stringify({ migrated, failed, at: new Date().toISOString() }, null, 2)}\n`,
  )
  console.log(`Migrated ${migrated.length}, failed ${failed.length}`)
  if (failed.length > 0) {
    for (const row of failed.slice(0, 20)) console.warn('fail', row.slug, row.reason)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
