/**
 * Self-host catalog logos from the official isotipo SVGs.
 *
 * For every entity whose catalog logo still resolves to a remote favicon
 * (Google) and that already has `data/isotipos/<slug>.svg`, rasterize the SVG to
 * a 256×256 transparent PNG (contained, ~8% padding per side) at
 * `public/logos/<slug>.png` and point `data/logo-overrides.json` at it.
 *
 * Idempotent: entities that already resolve to a hosted logo are left alone, and
 * an existing PNG is reused (only the override is wired). Pass `--force` to
 * re-render PNGs for the entities this script would otherwise fill, and
 * `--dry-run` to only list them.
 *
 *   node --experimental-strip-types scripts/rasterize-isotipos-to-logos.mts
 *
 * After running: regenerate datasets (`node --experimental-strip-types
 * scripts/run-prebuild.mts`) and look at the new tiles before committing.
 */
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { getAllEntities } from "../lib/entity-index.ts"
import { getEntityLogoUrl } from "../lib/entity-logo.ts"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const isotiposDir = path.join(repoRoot, "data", "isotipos")
const logosDir = path.join(repoRoot, "public", "logos")
const overridesPath = path.join(repoRoot, "data", "logo-overrides.json")

export const TILE_SIZE = 256
/** Padding per side, as a fraction of the tile. */
export const TILE_PADDING = 0.08
const RENDER_TARGET_PX = 1024
/** Below this share of non-transparent pixels the render is considered empty. */
const MIN_OPAQUE_RATIO = 0.01

/**
 * Isotipos that must not become the catalog tile (render wrong, or are worse
 * than the current favicon). Keep the reason next to each slug.
 */
export const SKIP_SLUGS: Record<string, string> = {
  carrefour: "isotipo monocromo azul (simple-icons): pierde el rojo de la marca",
  payoneer: "isotipo de simple-icons es la marca anterior, no el anillo actual",
  python: "isotipo monocromo (simple-icons): pierde el amarillo del logo oficial",
  porsche: "escudo monocromo en línea (simple-icons): el favicon a color es mejor",
  fiat: "isotipo de simple-icons es el escudo rojo anterior, no la marca actual",
  ethereum: "ícono de app con fondo cuadrado oscuro opaco, no un isotipo transparente",
  "genomma-lab": "los degradados del SVG no se renderizan bien (trazos incompletos)",
}

type Override = { logoUrl: string; logoSource: string }

export async function rasterizeIsotipoSvg(svg: Buffer): Promise<Buffer> {
  const meta = await sharp(svg, { failOn: "none" }).metadata()
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0) || 256
  // sharp rasterizes SVG at 72dpi by default; scale so the long side is ~1024px.
  const density = Math.min(2400, Math.max(72, Math.round((72 * RENDER_TARGET_PX) / longest)))
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 }

  let rendered = await sharp(svg, { density, failOn: "none" }).ensureAlpha().png().toBuffer()
  try {
    // Drop the transparent margins of the viewBox so padding is uniform.
    rendered = await sharp(rendered).trim({ background: transparent, threshold: 1 }).png().toBuffer()
  } catch {
    // trim throws on fully uniform images; the opacity check below reports those.
  }

  const pad = Math.round(TILE_SIZE * TILE_PADDING)
  const inner = TILE_SIZE - pad * 2
  return sharp(rendered)
    .resize(inner, inner, { fit: "contain", background: transparent })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: transparent })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

export async function opaqueRatio(png: Buffer): Promise<number> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let opaque = 0
  for (let i = 3; i < data.length; i += info.channels) {
    if (data[i] > 16) opaque += 1
  }
  return opaque / (info.width * info.height)
}

async function main() {
  const argv = process.argv.slice(2)
  const force = argv.includes("--force")
  const dryRun = argv.includes("--dry-run")

  const overrides = JSON.parse(await readFile(overridesPath, "utf8")) as Record<string, Override>
  const overrideKeyByLower = new Map(Object.keys(overrides).map((key) => [key.toLowerCase(), key]))

  const written: string[] = []
  const wired: string[] = []
  const skipped: string[] = []

  for (const entity of getAllEntities()) {
    if (getEntityLogoUrl(entity).startsWith("/")) continue
    const svgPath = path.join(isotiposDir, `${entity.slug}.svg`)
    if (!existsSync(svgPath)) continue
    if (SKIP_SLUGS[entity.slug]) {
      skipped.push(`${entity.slug}: ${SKIP_SLUGS[entity.slug]}`)
      continue
    }

    const pngPath = path.join(logosDir, `${entity.slug}.png`)
    if (force || !existsSync(pngPath)) {
      let png: Buffer
      try {
        png = await rasterizeIsotipoSvg(await readFile(svgPath))
      } catch (error) {
        skipped.push(`${entity.slug}: no se pudo rasterizar (${error instanceof Error ? error.message : error})`)
        continue
      }
      const ratio = await opaqueRatio(png)
      if (ratio < MIN_OPAQUE_RATIO) {
        skipped.push(`${entity.slug}: render vacío (${(ratio * 100).toFixed(2)}% opaco)`)
        continue
      }
      if (!dryRun) await writeFile(pngPath, png)
      written.push(entity.slug)
    }

    // Replace a stale remote override for the same domain (keys are matched case-insensitively).
    const existingKey = overrideKeyByLower.get(entity.domain.toLowerCase())
    if (existingKey && existingKey !== entity.domain) delete overrides[existingKey]
    overrides[entity.domain] = { logoUrl: `/logos/${entity.slug}.png`, logoSource: "hosted" }
    overrideKeyByLower.set(entity.domain.toLowerCase(), entity.domain)
    wired.push(entity.slug)
  }

  if (!dryRun && wired.length > 0) {
    await writeFile(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`, "utf8")
  }

  const prefix = dryRun ? "[dry-run] " : ""
  console.log(`${prefix}PNG generados: ${written.length}${written.length ? ` (${written.join(", ")})` : ""}`)
  console.log(`${prefix}Overrides apuntados a /logos/<slug>.png: ${wired.length}`)
  if (skipped.length > 0) {
    console.log(`Omitidos: ${skipped.length}`)
    for (const line of skipped) console.log(`  - ${line}`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("rasterize-isotipos-to-logos failed:", error)
    process.exitCode = 1
  })
}
