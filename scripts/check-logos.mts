import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getAllEntities } from "../lib/entity-index.ts"
import { checkEntityLogos } from "../lib/logo-quality/check.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

async function main() {
  const entities = getAllEntities().map((entity) => ({
    id: entity.id,
    name: entity.name,
    domain: entity.domain,
    slug: entity.slug,
    logoUrl: entity.logoUrl,
    logoSource: entity.logoSource,
  }))

  const results = await checkEntityLogos(entities, {
    publicDir: path.join(repoRoot, "public"),
    skipRedirectCheck: process.env.LOGO_CHECK_SKIP_REDIRECT === "1",
  })

  const failures = results.filter((result) => !result.ok)
  const reportPath = path.join(repoRoot, "data", "logo-check-report.json")
  await writeFile(reportPath, `${JSON.stringify({ failures, total: results.length }, null, 2)}\n`)

  if (failures.length > 0) {
    console.error(`Logo check failed for ${failures.length}/${results.length} entities`)
    for (const failure of failures.slice(0, 40)) {
      console.error(
        `- ${failure.slug}: ${failure.issues.map((issue) => issue.message).join("; ")}`,
      )
    }
    if (failures.length > 40) {
      console.error(`… y ${failures.length - 40} más (ver ${reportPath})`)
    }
    process.exitCode = 1
    return
  }

  console.log(`Logo check passed for ${results.length} entities`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
