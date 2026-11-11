import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { listThirdPartyCatalogLogos } from '../lib/catalog-logo-hosting.ts'
import { getAllEntities } from '../lib/entity-index.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

async function main() {
  const thirdParty = listThirdPartyCatalogLogos(getAllEntities())
  const reportPath = path.join(repoRoot, 'data', 'catalog-third-party-logos.json')
  await writeFile(reportPath, `${JSON.stringify(thirdParty, null, 2)}\n`)

  if (thirdParty.length > 0) {
    console.error(
      `Catalog has ${thirdParty.length} logo(s) still hotlinking third-party hosts (see ${reportPath})`,
    )
    for (const row of thirdParty.slice(0, 40)) {
      console.error(`- ${row.slug}: ${row.logoUrl}`)
    }
    if (thirdParty.length > 40) {
      console.error(`… and ${thirdParty.length - 40} more`)
    }
    process.exitCode = 1
    return
  }
  console.log('Catalog logos: all self-hosted or allowed favicon proxies')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
