import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.verify-loguitos/artifacts/logo-download-sweep',
)

type Comparison = {
  domain: string
  main: number
  pr: number
  regression: boolean
}

async function main(): Promise<void> {
  const comparison = JSON.parse(
    await readFile(path.join(dir, 'main-vs-pr.json'), 'utf8'),
  ) as {
    mainBase: string
    prBase: string
    regressionCount: number
    comparison: Comparison[]
  }

  const lines = [
    '# Logo-download override sweep (size=128)',
    '',
    `| Base | URL |`,
    `| --- | --- |`,
    `| main (Next) | ${comparison.mainBase} |`,
    `| PR (Workers) | ${comparison.prBase} |`,
    '',
    '## Summary',
    '',
  ]

  const tally = (rows: Comparison[], field: 'main' | 'pr') => {
    const counts: Record<string, number> = {}
    for (const row of rows) {
      const key = String(row[field])
      counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
  }

  lines.push(`- Main: ${JSON.stringify(tally(comparison.comparison, 'main'))}`)
  lines.push(`- PR: ${JSON.stringify(tally(comparison.comparison, 'pr'))}`)
  lines.push(`- Regressions (main 200, PR not 200): ${comparison.regressionCount}`)
  lines.push('')
  lines.push('## Pre-existing (unchanged vs main)')
  lines.push('')
  const unchangedBad = comparison.comparison.filter(
    (r) => r.main !== 200 && r.pr === r.main,
  )
  lines.push(`| Domain | Status |`)
  lines.push(`| --- | --- |`)
  for (const row of unchangedBad.sort((a, b) => a.domain.localeCompare(b.domain))) {
    lines.push(`| ${row.domain} | ${row.main} |`)
  }
  lines.push('')
  lines.push('## Full comparison')
  lines.push('')
  lines.push('| Domain | main | PR |')
  lines.push('| --- | --- | --- |')
  for (const row of [...comparison.comparison].sort((a, b) =>
    a.domain.localeCompare(b.domain),
  )) {
    lines.push(`| ${row.domain} | ${row.main} | ${row.pr} |`)
  }

  await writeFile(path.join(dir, 'SWEEP-REPORT.md'), lines.join('\n') + '\n')
  console.log(`Wrote ${path.join(dir, 'SWEEP-REPORT.md')}`)
}

await main()
