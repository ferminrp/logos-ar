import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')

type SweepRow = {
  domain: string
  status: number
  contentType: string | null
  error: string | null
  bodyPreview: string | null
}

async function loadOverrideDomains(listPath: string | null): Promise<string[]> {
  if (listPath) {
    const raw = await readFile(listPath, 'utf8')
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  }
  const overrides = JSON.parse(
    await readFile(path.join(REPO_ROOT, 'data/logo-overrides.json'), 'utf8'),
  ) as Record<string, unknown>
  return Object.keys(overrides).sort()
}

async function sweepBase(
  baseUrl: string,
  domains: string[],
  size = 128,
  format: 'png' | 'svg' = 'png',
): Promise<SweepRow[]> {
  const base = baseUrl.replace(/\/$/, '')
  const rows: SweepRow[] = []

  for (const domain of domains) {
    const url = `${base}/api/logo-download?domain=${encodeURIComponent(domain)}&format=${format}&size=${size}`
    try {
      const res = await fetch(url)
      const ct = res.headers.get('content-type')
      const okImage =
        format === 'png'
          ? res.ok && (ct?.includes('image/png') || ct?.includes('image/jpeg') || ct?.includes('image/webp'))
          : res.ok &&
            (ct?.includes('image/svg') ||
              ct?.includes('image/png') ||
              ct?.includes('image/jpeg'))
      if (okImage) {
        rows.push({
          domain,
          status: res.status,
          contentType: ct,
          error: null,
          bodyPreview: null,
        })
        continue
      }
      const text = await res.text()
      let error: string | null = null
      try {
        error = (JSON.parse(text) as { error?: string }).error ?? text.slice(0, 80)
      } catch {
        error = text.slice(0, 80)
      }
      rows.push({
        domain,
        status: res.status,
        contentType: ct,
        error,
        bodyPreview: text.slice(0, 120),
      })
    } catch (err) {
      rows.push({
        domain,
        status: 0,
        contentType: null,
        error: err instanceof Error ? err.message : String(err),
        bodyPreview: null,
      })
    }
  }
  return rows
}

function summarize(rows: SweepRow[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const key = row.status === 200 ? '200' : `${row.status}`
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function compareRows(
  main: SweepRow[],
  pr: SweepRow[],
): Array<{
  domain: string
  main: number
  pr: number
  regression: boolean
}> {
  const prByDomain = new Map(pr.map((r) => [r.domain, r.status]))
  const out: Array<{ domain: string; main: number; pr: number; regression: boolean }> =
    []
  for (const row of main) {
    const prStatus = prByDomain.get(row.domain) ?? 0
    const regression =
      row.status === 200 && prStatus !== 200
    out.push({ domain: row.domain, main: row.status, pr: prStatus, regression })
  }
  return out
}

async function main(): Promise<void> {
  const domains = await loadOverrideDomains(
    process.env.LOGO_DOWNLOAD_DOMAIN_LIST ?? null,
  )
  const size = Number.parseInt(process.env.LOGO_DOWNLOAD_SWEEP_SIZE ?? '128', 10)
  const formats = (process.env.LOGO_DOWNLOAD_SWEEP_FORMATS ?? 'png')
    .split(',')
    .map((f) => f.trim())
    .filter((f): f is 'png' | 'svg' => f === 'png' || f === 'svg')
  const mainBase = process.env.LOGO_DOWNLOAD_MAIN_BASE?.replace(/\/$/, '')
  const prBase =
    process.env.LOGO_DOWNLOAD_PR_BASE?.replace(/\/$/, '') ??
    process.env.VERIFY_LOGUITOS_BASE_URL?.replace(/\/$/, '')

  if (!prBase) {
    throw new Error(
      'Set LOGO_DOWNLOAD_PR_BASE or VERIFY_LOGUITOS_BASE_URL for the Workers sweep',
    )
  }

  const outDir = path.join(REPO_ROOT, '.verify-loguitos', 'artifacts', 'logo-download-sweep')
  await mkdir(outDir, { recursive: true })

  let prRows: SweepRow[] = []
  for (const format of formats.length > 0 ? formats : (['png'] as const)) {
    const formatRows = await sweepBase(prBase, domains, size, format)
    if (format === 'png') {
      prRows = formatRows
    }
    const suffix = format === 'png' ? '' : `-${format}`
    await writeFile(
      path.join(outDir, `pr-sweep${suffix}.json`),
      JSON.stringify(
        {
          baseUrl: prBase,
          format,
          size,
          summary: summarize(formatRows),
          rows: formatRows,
        },
        null,
        2,
      ),
    )
    console.log(
      `PR sweep ${prBase} format=${format} size=${size}: ${JSON.stringify(summarize(formatRows))}`,
    )
  }
  if (mainBase) {
    const mainRows = await sweepBase(mainBase, domains, size, 'png')
    const comparison = compareRows(mainRows, prRows)
    const regressions = comparison.filter((r) => r.regression)
    await writeFile(
      path.join(outDir, 'main-sweep.json'),
      JSON.stringify(
        { baseUrl: mainBase, summary: summarize(mainRows), rows: mainRows },
        null,
      ),
    )
    await writeFile(
      path.join(outDir, 'main-vs-pr.json'),
      JSON.stringify(
        {
          mainBase,
          prBase,
          regressionCount: regressions.length,
          regressions,
          comparison,
        },
        null,
        2,
      ),
    )
    console.log(`Main sweep ${mainBase}: ${JSON.stringify(summarize(mainRows))}`)
    console.log(`Regressions (main 200 → PR not 200): ${regressions.length}`)
    for (const row of regressions.slice(0, 30)) {
      console.log(`  ${row.domain}: ${row.main} → ${row.pr}`)
    }
  }

  const failed = prRows.filter((r) => r.status !== 200)
  if (process.env.LOGO_DOWNLOAD_SWEEP_STRICT === '1' && failed.length > 0) {
    throw new Error(`PR sweep: ${failed.length}/${domains.length} not HTTP 200 PNG`)
  }

  if (process.env.LOGO_DOWNLOAD_SWEEP_WASM_AUDIT === '1') {
    const { spawnSync } = await import('node:child_process')
    const audit = spawnSync(
      'node',
      ['--experimental-strip-types', 'scripts/audit-override-wasm-raster.mts'],
      { cwd: REPO_ROOT, stdio: 'inherit', env: process.env },
    )
    if (audit.status !== 0) {
      throw new Error('wasm raster audit failed')
    }
  }
}

await main()
