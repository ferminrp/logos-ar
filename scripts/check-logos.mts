import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  githubActionsWarning,
  isBlockingFailure,
  resolveChangedEntitySlugs,
} from "../lib/logo-quality/changed-entities.ts"
import { getAllEntities } from "../lib/entity-index.ts"
import { checkEntityLogos } from "../lib/logo-quality/check.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

type LogoCheckScope = "full" | "pr"

function resolveScope(): LogoCheckScope {
  const raw = process.env.LOGO_CHECK_SCOPE?.trim().toLowerCase()
  return raw === "pr" ? "pr" : "full"
}

async function main() {
  const scope = resolveScope()
  const entities = getAllEntities().map((entity) => ({
    id: entity.id,
    name: entity.name,
    domain: entity.domain,
    slug: entity.slug,
    logoUrl: entity.logoUrl,
    logoSource: entity.logoSource,
  }))

  const blockingSlugs =
    scope === "pr"
      ? await resolveChangedEntitySlugs(getAllEntities(), {
          baseRef: process.env.LOGO_CHECK_BASE_REF?.trim() || "origin/main",
          repoRoot,
        })
      : null

  const results = await checkEntityLogos(entities, {
    publicDir: path.join(repoRoot, "public"),
    skipRedirectCheck: process.env.LOGO_CHECK_SKIP_REDIRECT === "1",
  })

  const failures = results.filter((result) => !result.ok)
  const blockingFailures = failures.filter((failure) =>
    isBlockingFailure(failure.slug, blockingSlugs),
  )
  const warningFailures = failures.filter(
    (failure) => !isBlockingFailure(failure.slug, blockingSlugs),
  )

  const reportPath = path.join(repoRoot, "data", "logo-check-report.json")
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        scope,
        blockingSlugs: blockingSlugs ? [...blockingSlugs].sort() : null,
        blockingFailures,
        warningFailures,
        total: results.length,
      },
      null,
      2,
    )}\n`,
  )

  if (warningFailures.length > 0) {
    console.warn(
      `Logo check warnings (non-blocking) for ${warningFailures.length} entities`,
    )
    for (const failure of warningFailures.slice(0, 40)) {
      const line = `${failure.slug}: ${failure.issues.map((issue) => issue.message).join("; ")}`
      if (process.env.GITHUB_ACTIONS === "true") {
        console.log(githubActionsWarning(line))
      } else {
        console.warn(`- ${line}`)
      }
    }
    if (warningFailures.length > 40) {
      console.warn(`… y ${warningFailures.length - 40} más (ver ${reportPath})`)
    }
  }

  if (blockingFailures.length > 0) {
    console.error(
      `Logo check failed for ${blockingFailures.length}/${results.length} entities` +
        (scope === "pr" ? " (PR-scoped blocking)" : ""),
    )
    for (const failure of blockingFailures.slice(0, 40)) {
      console.error(
        `- ${failure.slug}: ${failure.issues.map((issue) => issue.message).join("; ")}`,
      )
    }
    if (blockingFailures.length > 40) {
      console.error(`… y ${blockingFailures.length - 40} más (ver ${reportPath})`)
    }
    process.exitCode = 1
    return
  }

  if (scope === "pr" && blockingSlugs && blockingSlugs.size === 0) {
    console.log(
      `Logo check passed (no entity data changes in PR; ${warningFailures.length} external warnings)`,
    )
  } else {
    console.log(`Logo check passed for ${results.length} entities`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
