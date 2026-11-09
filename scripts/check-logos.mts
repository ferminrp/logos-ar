import { appendFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  githubActionsWarning,
  resolveChangedEntitySlugs,
} from "../lib/logo-quality/changed-entities.ts"
import { getAllEntities } from "../lib/entity-index.ts"
import { type LogoCheckResult, checkEntityLogos } from "../lib/logo-quality/check.ts"
import {
  type GateResult,
  formatFailureLine,
  partitionFailures,
} from "../lib/logo-quality/gate.ts"

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
    transientRecheckDelayMs: Number.parseInt(
      process.env.LOGO_CHECK_RECHECK_DELAY_MS ?? "30000",
      10,
    ),
  })

  const gate = partitionFailures(results, {
    blockingSlugs,
    total: results.length,
  })
  const warnings = [...gate.transient, ...gate.outOfScope]

  const reportPath = path.join(repoRoot, "data", "logo-check-report.json")
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        scope,
        blockingSlugs: blockingSlugs ? [...blockingSlugs].sort() : null,
        blockingFailures: gate.blocking,
        transientFailures: gate.transient,
        outOfScopeFailures: gate.outOfScope,
        transientLimit: gate.transientLimit,
        transientOverLimit: gate.transientOverLimit,
        total: results.length,
      },
      null,
      2,
    )}\n`,
  )

  await writeStepSummary(scope, results.length, gate)

  if (warnings.length > 0) {
    console.warn(
      `Logo check warnings (non-blocking) for ${warnings.length} entities` +
        ` (${gate.transient.length} external/transient, ${gate.outOfScope.length} outside PR scope)`,
    )
    for (const failure of warnings.slice(0, 40)) {
      const line = formatFailureLine(failure)
      if (process.env.GITHUB_ACTIONS === "true") {
        console.log(githubActionsWarning(line))
      } else {
        console.warn(`- ${line}`)
      }
    }
    if (warnings.length > 40) {
      console.warn(`… y ${warnings.length - 40} más (ver ${reportPath})`)
    }
  }

  if (gate.blocking.length > 0) {
    if (gate.transientOverLimit) {
      console.error(
        `Demasiadas fallas externas (> ${gate.transientLimit}): probablemente el runner ` +
          "no tiene red o cambió el servicio de favicons; se tratan como bloqueantes.",
      )
    }
    console.error(
      `Logo check failed for ${gate.blocking.length}/${results.length} entities` +
        (scope === "pr" ? " (PR-scoped blocking)" : ""),
    )
    for (const failure of gate.blocking.slice(0, 40)) {
      console.error(`- ${formatFailureLine(failure)}`)
    }
    if (gate.blocking.length > 40) {
      console.error(`… y ${gate.blocking.length - 40} más (ver ${reportPath})`)
    }
    process.exitCode = 1
    return
  }

  if (scope === "pr" && blockingSlugs && blockingSlugs.size === 0) {
    console.log(
      `Logo check passed (no entity data changes in PR; ${warnings.length} warnings)`,
    )
  } else {
    console.log(
      `Logo check passed for ${results.length} entities (${warnings.length} warnings)`,
    )
  }
}

async function writeStepSummary(
  scope: LogoCheckScope,
  total: number,
  gate: GateResult,
): Promise<void> {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) return
  const section = (title: string, items: LogoCheckResult[]) =>
    items.length === 0
      ? ""
      : `\n### ${title} (${items.length})\n\n` +
        items.map((item) => `- \`${formatFailureLine(item)}\``).join("\n") +
        "\n"
  const body =
    `## Logo quality (${scope}, ${total} entidades)\n` +
    (gate.blocking.length === 0 ? "\n✅ Sin fallas bloqueantes\n" : "") +
    section("❌ Bloqueantes", gate.blocking) +
    section("⚠️ Externas / transitorias (no bloquean)", gate.transient) +
    section("ℹ️ Fuera del alcance del PR (no bloquean)", gate.outOfScope)
  await appendFile(summaryPath, body)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
