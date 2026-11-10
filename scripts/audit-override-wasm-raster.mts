import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describeWorkerWasmDecodeRisk } from '../lib/logo-download-worker-budget.ts'
import { measureImage } from '../lib/logo-quality/image-metrics.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const SWEEP_SIZE = Number.parseInt(process.env.LOGO_DOWNLOAD_SWEEP_SIZE ?? '128', 10)

type Row = {
  domain: string
  logoUrl: string
  width: number
  height: number
  format: string
  bytes: number
  risk: string
}

async function main(): Promise<void> {
  const overrides = JSON.parse(
    await readFile(path.join(REPO_ROOT, 'data/logo-overrides.json'), 'utf8'),
  ) as Record<string, { logoUrl: string }>

  const rows: Row[] = []

  for (const [domain, entry] of Object.entries(overrides).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const logoUrl = entry.logoUrl
    if (!logoUrl.startsWith('http')) continue
  const lower = logoUrl.toLowerCase()
    if (!/\.(jpe?g|webp)(\?|$)/.test(lower) && !logoUrl.includes('format=webp')) {
      continue
    }

    try {
      const res = await fetch(logoUrl, {
        signal: AbortSignal.timeout(20_000),
        headers: { 'User-Agent': 'LoguitosBot/1.0 (+https://loguitos.app)' },
      })
      if (!res.ok) continue
      const bytes = new Uint8Array(await res.arrayBuffer())
      const metrics = measureImage(bytes)
      const risk = describeWorkerWasmDecodeRisk(
        bytes.byteLength,
        metrics,
        SWEEP_SIZE,
      )
      if (risk) {
        rows.push({
          domain,
          logoUrl,
          width: metrics.width,
          height: metrics.height,
          format: metrics.format,
          bytes: bytes.byteLength,
          risk,
        })
      }
    } catch {
      // skip unreachable origins in offline CI
    }
  }

  const outDir = path.join(
    REPO_ROOT,
    '.verify-loguitos',
    'artifacts',
    'logo-download-sweep',
  )
  await mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, 'wasm-raster-risks.json')
  await writeFile(outPath, JSON.stringify({ sweepSize: SWEEP_SIZE, rows }, null, 2))
  console.log(`Wrote ${rows.length} WASM decode risks to ${outPath}`)
  for (const row of rows.slice(0, 20)) {
    console.log(`  ${row.domain}: ${row.width}×${row.height} ${row.format}`)
  }
}

await main()
