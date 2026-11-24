/**
 * Derives per-logo display assets from the catalog:
 *  - `public/thumbs/<slug>.webp`: 64px list thumbnail (isotipo when there is one,
 *    otherwise the hosted PNG), so listings stop downloading 256px PNGs for 20px slots.
 *  - `data/logo-assets.json`: which slugs have a real hosted SVG, and the ink tone of
 *    transparent logos so the UI can put a contrasting tile behind them.
 *
 * Idempotent; run after adding or changing files in public/logos or data/isotipos:
 *   pnpm generate:logo-assets
 */
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { getAllEntities } from '../lib/entity-index.ts'
import { getEntityLogoUrl } from '../lib/entity-logo.ts'
import isotiposMetadata from '../data/isotipos/metadata.json' with { type: 'json' }

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const logosDir = path.join(repoRoot, 'public/logos')
const isotiposDir = path.join(repoRoot, 'data/isotipos')
const thumbsDir = path.join(repoRoot, 'public/thumbs')
const outputPath = path.join(repoRoot, 'data/logo-assets.json')

const THUMB_SIZE = 64
/** Luminance bounds for "ink still readable" on the dark and light page backgrounds. */
const VISIBLE_ON_DARK_MIN_LUMINANCE = 0.09
const VISIBLE_ON_LIGHT_MAX_LUMINANCE = 0.62
/** A logo needs a tile when less than this share of its ink is readable. */
const MIN_VISIBLE_SHARE = 0.15
/** Mostly opaque images bring their own background and need no tile. */
const OPAQUE_SHARE = 0.9

type Tone = 'light' | 'dark'
type AssetInfo = { svg?: true; thumb?: true; tone?: Tone; thumbTone?: Tone }

/**
 * Automatic luminance measurement can miss a dark wordmark when an isologo
 * has enough light ink. These slugs still need a contrast tile on dark surfaces.
 */
const TONE_OVERRIDES: Partial<Record<string, Tone>> = {
  exactly: 'dark',
}

function channelToLinear(value: number): number {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

async function measureTone(input: Buffer): Promise<Tone | undefined> {
  const { data, info } = await sharp(input)
    .resize(96, 96, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let ink = 0
  let visibleOnDark = 0
  let visibleOnLight = 0
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255
    if (alpha < 0.2) continue
    const luminance =
      0.2126 * channelToLinear(data[i]) +
      0.7152 * channelToLinear(data[i + 1]) +
      0.0722 * channelToLinear(data[i + 2])
    ink += alpha
    if (luminance > VISIBLE_ON_DARK_MIN_LUMINANCE) visibleOnDark += alpha
    if (luminance < VISIBLE_ON_LIGHT_MAX_LUMINANCE) visibleOnLight += alpha
  }

  const totalPixels = info.width * info.height
  if (ink === 0 || ink / totalPixels > OPAQUE_SHARE) return undefined
  if (visibleOnDark / ink < MIN_VISIBLE_SHARE) return 'dark'
  if (visibleOnLight / ink < MIN_VISIBLE_SHARE) return 'light'
  return undefined
}

async function renderThumb(input: Buffer): Promise<Buffer> {
  const render = (density: number) =>
    sharp(input, { density })
      .resize(THUMB_SIZE, THUMB_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 86, alphaQuality: 90, effort: 6 })
      .toBuffer()
  try {
    return await render(300)
  } catch {
    // SVGs with a huge intrinsic size overflow sharp's pixel limit at high density.
    return sharp(input, { density: 24, limitInputPixels: false })
      .resize(THUMB_SIZE, THUMB_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 86, alphaQuality: 90, effort: 6 })
      .toBuffer()
  }
}

async function main() {
  const isotipoSlugs = new Set(
    (isotiposMetadata as { slug: string }[]).map((row) => row.slug),
  )
  await mkdir(thumbsDir, { recursive: true })

  const items: Record<string, AssetInfo> = {}
  const expectedThumbs = new Set<string>()

  for (const entity of getAllEntities()) {
    const { slug } = entity
    const info: AssetInfo = {}

    if (existsSync(path.join(logosDir, `${slug}.svg`))) {
      info.svg = true
    }

    const logoUrl = getEntityLogoUrl(entity)
    const hostedMatch = /^\/logos\/([a-z0-9-]+)\.png$/.exec(logoUrl)
    const hostedPngPath = hostedMatch
      ? path.join(logosDir, `${hostedMatch[1]}.png`)
      : null
    const hostedPng =
      hostedPngPath && existsSync(hostedPngPath)
        ? await readFile(hostedPngPath)
        : null

    if (hostedPng) {
      const tone = TONE_OVERRIDES[slug] ?? (await measureTone(hostedPng))
      if (tone) info.tone = tone
    }

    const isotipoPath = path.join(isotiposDir, `${slug}.svg`)
    const thumbSource =
      isotipoSlugs.has(slug) && existsSync(isotipoPath)
        ? await readFile(isotipoPath)
        : hostedPng

    if (thumbSource) {
      try {
        const thumb = await renderThumb(thumbSource)
        const file = `${slug}.webp`
        const target = path.join(thumbsDir, file)
        const current = existsSync(target) ? await readFile(target) : null
        if (!current || !current.equals(thumb)) {
          await writeFile(target, thumb)
        }
        expectedThumbs.add(file)
        info.thumb = true
        const thumbTone = TONE_OVERRIDES[slug] ?? (await measureTone(thumb))
        if (thumbTone) info.thumbTone = thumbTone
      } catch (error) {
        console.warn(
          `[logo-assets] thumbnail skipped for ${slug}:`,
          error instanceof Error ? error.message : error,
        )
      }
    }

    if (Object.keys(info).length > 0) {
      items[slug] = info
    }
  }

  for (const file of await readdir(thumbsDir)) {
    if (!expectedThumbs.has(file)) {
      await rm(path.join(thumbsDir, file))
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(items).sort(([a], [b]) => a.localeCompare(b)),
  )
  await writeFile(outputPath, `${JSON.stringify({ items: sorted }, null, 2)}\n`)

  const values = Object.values(sorted)
  console.log(
    `[logo-assets] ${values.filter((v) => v.thumb).length} thumbs, ` +
      `${values.filter((v) => v.svg).length} svg, ` +
      `${values.filter((v) => v.tone || v.thumbTone).length} toned`,
  )
}

main().catch((error) => {
  console.error('generate-logo-assets failed:', error)
  process.exitCode = 1
})
