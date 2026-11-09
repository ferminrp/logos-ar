import { appendFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  githubActionsWarning,
  resolveChangedEntitySlugs,
} from "../lib/logo-quality/changed-entities.ts"
import { getAllEntities } from "../lib/entity-index.ts"
import { checkEntityLogos, type LogoCheckResult } from "../lib/logo-quality/check.ts"
import {
  formatFailureLine,
  isLikelyNetworkOutage,
  MAX_UNAVAILABLE_RATIO,
  partitionFailures,
  renderUnavailableIssueBody,
} from "../lib/logo-quality/classify.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

type LogoCheckScope = "full" | "pr"

const MAX_LINES = 40

function resolveScope(): LogoCheckScope {
  const raw = process.env.LOGO_CHECK_SCOPE?.trim().toLowerCase()
  return raw === "pr" ? "pr" : "full"
}

function printWarnings(title: string, failures: LogoCheckResult[], reportPath: string) {
  if (failures.length === 0) return
  console.warn(`${title} (${failures.length}, no bloquean)`)
  for (const failure of failures.slice(0, MAX_LINES)) {
    const line = formatFailureLine(failure)
    if (process.env.GITHUB_ACTIONS === "true") {
      console.log(githubActionsWarning(line, title))
    } else {
      console.warn(`- ${line}`)
    }
  }
  if (failures.length > MAX_LINES) {
    console.warn(`… y ${failures.length - MAX_LINES} más (ver ${reportPath})`)
  }
}

async function main() {
  const scope = resolveScope()
  const strictAvailability = process.env.LOGO_CHECK_STRICT_AVAILABILITY === "1"
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

  const { blocking, outOfScope, unavailable } = partitionFailures(results, {
    blockingSlugs,
    strictAvailability,
  })

  const reportPath = path.join(repoRoot, "data", "logo-check-report.json")
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        scope,
        strictAvailability,
        blockingSlugs: blockingSlugs ? [...blockingSlugs].sort() : null,
        blockingFailures: blocking,
        outOfScopeFailures: outOfScope,
        unavailableFailures: unavailable,
        total: results.length,
      },
      null,
      2,
    )}\n`,
  )

  // Markdown for the scheduled job's tracking issue (empty file = all good).
  const networkOutage = isLikelyNetworkOutage(unavailable.length, results.length)

  // Not written on a runner-wide outage: that would open an issue listing
  // the whole catalog for a problem that is not in the catalog.
  const issueBodyPath = process.env.LOGO_CHECK_UNAVAILABLE_ISSUE_PATH
  if (issueBodyPath && !networkOutage) {
    const runUrl =
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : undefined
    await writeFile(
      issueBodyPath,
      unavailable.length > 0
        ? renderUnavailableIssueBody(unavailable, {
            runUrl,
            date: new Date().toISOString().slice(0, 10),
          })
        : "",
    )
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      [
        `### Logo check (${scope})`,
        "",
        `- Entidades: ${results.length}`,
        `- Bloqueantes: ${blocking.length}`,
        `- Fuera del PR: ${outOfScope.length}`,
        `- Externos sin respuesta: ${unavailable.length}`,
        "",
        ...[...blocking, ...outOfScope, ...unavailable].map(
          (failure) => `- \`${formatFailureLine(failure)}\``,
        ),
        "",
      ].join("\n"),
    )
  }

  printWarnings("Logo externo sin respuesta", unavailable, reportPath)
  printWarnings("Logo con problemas fuera del PR", outOfScope, reportPath)

  if (blocking.length > 0) {
    console.error(
      `Logo check failed for ${blocking.length}/${results.length} entities` +
        (scope === "pr" ? " (PR-scoped blocking)" : ""),
    )
    for (const failure of blocking.slice(0, MAX_LINES)) {
      console.error(`- ${formatFailureLine(failure)}`)
    }
    if (blocking.length > MAX_LINES) {
      console.error(`… y ${blocking.length - MAX_LINES} más (ver ${reportPath})`)
    }
    process.exitCode = 1
    return
  }

  if (networkOutage) {
    console.error(
      `Logo check could not run: ${unavailable.length}/${results.length} logos externos sin respuesta ` +
        `(> ${MAX_UNAVAILABLE_RATIO * 100}%). Probablemente un problema de red del runner, no de los logos.`,
    )
    process.exitCode = 1
    return
  }

  console.log(
    `Logo check passed for ${results.length} entities` +
      (unavailable.length + outOfScope.length > 0
        ? ` (${unavailable.length + outOfScope.length} warnings)`
        : ""),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
