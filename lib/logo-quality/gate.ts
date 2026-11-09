import { isBlockingFailure } from "./changed-entities.ts"
import { type LogoCheckResult, isTransientOnlyFailure } from "./check.ts"

export type GateOptions = {
  /** Slugs touched by the PR, or null for a full-catalog run. */
  blockingSlugs: Set<string> | null
  /** Total entities checked (used for the outage threshold). */
  total: number
  /**
   * If more than this many entities fail only for transient reasons, treat it
   * as a systemic problem (runner network, Google favicon API change, ...) and
   * block anyway. Defaults to max(10, 5% of the catalog).
   */
  maxTransientFailures?: number
}

export type GateResult = {
  blocking: LogoCheckResult[]
  /** Non-blocking: external services were unavailable (rotates day to day). */
  transient: LogoCheckResult[]
  /** Non-blocking: real issues on entities outside the PR scope. */
  outOfScope: LogoCheckResult[]
  transientLimit: number
  transientOverLimit: boolean
}

export function defaultTransientLimit(total: number): number {
  return Math.max(10, Math.ceil(total * 0.05))
}

/**
 * Decide which logo-check failures fail CI.
 *
 * - Real quality problems (too small, generic icon, duplicate, invisible,
 *   redirect to another brand, broken hosted file, dead hotlink) always block
 *   on full-catalog runs, and block on PRs when the entity was touched.
 * - On full-catalog runs (push to main, nightly schedule), transient-only
 *   failures (third-party site or favicon proxy down) are warnings, unless
 *   there are so many that the checker itself is broken.
 * - On PRs, touched entities block on any failure, transient or not: a new
 *   entity with a wrong domain also yields a favicon-proxy 404, and the PR is
 *   the moment to catch it.
 */
export function partitionFailures(
  results: LogoCheckResult[],
  options: GateOptions,
): GateResult {
  const transientLimit =
    options.maxTransientFailures ?? defaultTransientLimit(options.total)
  const blocking: LogoCheckResult[] = []
  const transient: LogoCheckResult[] = []
  const outOfScope: LogoCheckResult[] = []

  for (const result of results) {
    if (result.ok) continue
    if (!isBlockingFailure(result.slug, options.blockingSlugs)) {
      outOfScope.push(result)
    } else if (options.blockingSlugs === null && isTransientOnlyFailure(result)) {
      transient.push(result)
    } else {
      blocking.push(result)
    }
  }

  const transientOverLimit = transient.length > transientLimit
  return {
    blocking: transientOverLimit ? [...blocking, ...transient] : blocking,
    transient: transientOverLimit ? [] : transient,
    outOfScope,
    transientLimit,
    transientOverLimit,
  }
}

export function formatFailureLine(result: LogoCheckResult): string {
  return `${result.slug}: ${result.issues.map((issue) => issue.message).join("; ")}`
}
