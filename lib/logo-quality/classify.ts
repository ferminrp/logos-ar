import type { LogoCheckCode, LogoCheckResult } from "./check.ts"

/**
 * Issue codes that only say "a third-party URL did not answer as expected
 * right now" (Google favicon 404s, timeouts, DNS errors, bot walls returning
 * HTML). They change day to day without any commit in this repo, so on the
 * full-catalog run they are reported, not used to fail `main`.
 */
export const AVAILABILITY_ISSUE_CODES: ReadonlySet<LogoCheckCode> = new Set([
  "fetch-failed",
  "site-unreachable",
])

export function isExternalLogoUrl(logoUrl: string): boolean {
  return !logoUrl.startsWith("/")
}

/**
 * True when every issue of the failure is an availability problem on an
 * external URL. A hosted logo (`/logos/...`) that cannot be read is a real
 * repo bug (missing file), so it is never treated as availability-only.
 */
export function isAvailabilityOnlyFailure(result: LogoCheckResult): boolean {
  if (result.ok || result.issues.length === 0) return false
  if (!isExternalLogoUrl(result.logoUrl)) return false
  return result.issues.every((issue) => AVAILABILITY_ISSUE_CODES.has(issue.code))
}

export type FailurePartition = {
  /** Fail the job. */
  blocking: LogoCheckResult[]
  /** Quality failures on entities outside the PR scope. */
  outOfScope: LogoCheckResult[]
  /** External URLs that did not answer (full-catalog runs only). */
  unavailable: LogoCheckResult[]
}

export type PartitionOptions = {
  /** Slugs touched by the PR; `null` means full-catalog run. */
  blockingSlugs: Set<string> | null
  /** Treat availability failures as blocking on full-catalog runs too. */
  strictAvailability?: boolean
}

export function partitionFailures(
  results: LogoCheckResult[],
  { blockingSlugs, strictAvailability = false }: PartitionOptions,
): FailurePartition {
  const partition: FailurePartition = { blocking: [], outOfScope: [], unavailable: [] }

  for (const result of results) {
    if (result.ok) continue

    if (blockingSlugs) {
      // PR scope: anything wrong with an entity the PR touched blocks,
      // including a brand-new URL that 404s. The rest is informational.
      if (blockingSlugs.has(result.slug)) partition.blocking.push(result)
      else if (isAvailabilityOnlyFailure(result)) partition.unavailable.push(result)
      else partition.outOfScope.push(result)
      continue
    }

    if (!strictAvailability && isAvailabilityOnlyFailure(result)) {
      partition.unavailable.push(result)
    } else {
      partition.blocking.push(result)
    }
  }

  return partition
}

/**
 * If this share of the catalog is unreachable the problem is the runner's
 * network (or a global outage), not individual links: the check did not
 * really run, so it must fail instead of passing with warnings.
 */
export const MAX_UNAVAILABLE_RATIO = 0.25

export function isLikelyNetworkOutage(
  unavailableCount: number,
  total: number,
  maxRatio = MAX_UNAVAILABLE_RATIO,
): boolean {
  if (total === 0) return false
  return unavailableCount / total > maxRatio
}

export function formatFailureLine(result: LogoCheckResult): string {
  return `${result.slug}: ${result.issues.map((issue) => issue.message).join("; ")}`
}

/** Markdown body for the tracking issue opened by the scheduled run. */
export function renderUnavailableIssueBody(
  unavailable: LogoCheckResult[],
  { runUrl, date }: { runUrl?: string; date: string },
): string {
  const rows = [...unavailable]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map(
      (result) =>
        `| \`${result.slug}\` | ${result.domain} | ${result.issues
          .map((issue) => issue.message.replace(/\|/g, "\\|"))
          .join("<br>")} |`,
    )

  return [
    `El chequeo diario de logos (${date}) encontró **${unavailable.length}** logo(s) externos que no respondieron.`,
    "",
    "No bloquean `main` porque dependen de servicios de terceros (Google favicons, sitios de las marcas), pero si persisten varios días conviene reemplazar la URL por un logo hosteado en `public/logos/` (`data/logo-overrides.json`).",
    "",
    "| Slug | Dominio | Error |",
    "| --- | --- | --- |",
    ...rows,
    "",
    runUrl ? `Run: ${runUrl}` : "",
    "",
    "_Este issue se actualiza solo en cada corrida programada y se cierra cuando todos los logos vuelven a responder._",
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n")
}
