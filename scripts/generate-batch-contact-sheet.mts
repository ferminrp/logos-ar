import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { getAllEntities } from "../lib/entity-index.ts"
import { getEntityLogoUrl } from "../lib/entity-logo.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const outDir =
  process.env.CONTACT_SHEET_OUT ??
  path.join("/cursor/stores/self/artifacts/loguitos")

const BATCH_MIN_ID = 452
const COLS = 8
const LOGO_PX = 64
const PER_SHEET = 40
const TILE_W = 140
const TILE_H = 120
const PAD = 16

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

async function logoDataUrl(logoUrl: string): Promise<string> {
  if (logoUrl.startsWith("/")) {
    const filePath = path.join(repoRoot, "public", logoUrl.replace(/^\//, ""))
    const buf = await readFile(filePath)
    return `data:image/png;base64,${buf.toString("base64")}`
  }
  const response = await fetch(logoUrl, {
    headers: { "User-Agent": "LogosArgentina-ContactSheet/1.0" },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`fetch ${logoUrl}: ${response.status}`)
  const buf = Buffer.from(await response.arrayBuffer())
  const mime = response.headers.get("content-type") ?? "image/png"
  return `data:${mime};base64,${buf.toString("base64")}`
}

async function sheetHtml(
  brands: Array<{ name: string; category: string; logoUrl: string }>,
  sheetIndex: number,
  totalSheets: number,
  theme: "light" | "dark",
): Promise<string> {
  const isDark = theme === "dark"
  const pageBg = isDark ? "#0f172a" : "#f8fafc"
  const text = isDark ? "#f1f5f9" : "#0f172a"
  const tileBg = isDark ? "#1e293b" : "#fff"
  const tileBorder = isDark ? "#334155" : "#e2e8f0"
  const catColor = isDark ? "#94a3b8" : "#64748b"
  const width = COLS * TILE_W + PAD * 2
  const rows = Math.ceil(brands.length / COLS)
  const height = rows * TILE_H + PAD * 2 + 36
  const dataUrls = await Promise.all(brands.map((b) => logoDataUrl(b.logoUrl)))
  const tiles = brands
    .map((b, idx) => {
      const logo = dataUrls[idx]!
      return `<div class="tile">
        <img src="${logo}" width="${LOGO_PX}" height="${LOGO_PX}" alt="" />
        <div class="name">${escapeHtml(b.name)}</div>
        <div class="cat">${escapeHtml(b.category)}</div>
      </div>`
    })
    .join("")

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: ${pageBg}; color: ${text}; }
  h1 { font-size: 14px; font-weight: 600; padding: 10px ${PAD}px 6px; }
  .grid { display: grid; grid-template-columns: repeat(${COLS}, ${TILE_W}px); gap: 8px; padding: 0 ${PAD}px ${PAD}px; width: ${width}px; }
  .tile { width: ${TILE_W}px; height: ${TILE_H}px; background: ${tileBg}; border: 1px solid ${tileBorder}; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  img { object-fit: contain; }
  .name { font-size: 11px; font-weight: 600; margin-top: 6px; line-height: 1.2; max-height: 26px; overflow: hidden; }
  .cat { font-size: 9px; color: ${catColor}; margin-top: 2px; }
</style></head>
<body>
  <h1>PR #37 batch (id ≥ ${BATCH_MIN_ID}) — ${theme} — hoja ${sheetIndex + 1}/${totalSheets}</h1>
  <div class="grid">${tiles}</div>
</body></html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const entities = getAllEntities()
    .filter((e) => e.id >= BATCH_MIN_ID)
    .sort((a, b) => a.id - b.id)

  const brands = entities.map((e) => ({
    name: e.name,
    category: e.categoryName ?? e.categoryId,
    logoUrl: getEntityLogoUrl(e),
  }))

  const sheets = chunk(brands, PER_SHEET)
  const browser = await chromium.launch()
  const page = await browser.newPage()

  for (const theme of ["light", "dark"] as const) {
    for (let i = 0; i < sheets.length; i++) {
      const html = await sheetHtml(sheets[i]!, i, sheets.length, theme)
      await page.setContent(html, { waitUntil: "load" })
      await page.waitForTimeout(300)
      const outPath = path.join(
        outDir,
        `contact-sheet-${theme}-${String(i + 1).padStart(2, "0")}.png`,
      )
      await page.screenshot({ path: outPath, fullPage: true })
      console.log("wrote", outPath)
    }
  }

  await browser.close()
  console.log(`Contact sheets: ${sheets.length} images, ${brands.length} brands`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
