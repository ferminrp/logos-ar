import { execFile } from "node:child_process"
import { promisify } from "node:util"
import type { EntityRecord } from "../entity-index.ts"

const execFileAsync = promisify(execFile)

export type ChangedEntitiesOptions = {
  baseRef: string
  repoRoot: string
  execGit?: (args: string[], cwd: string) => Promise<string>
}

async function defaultExecGit(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync("git", args, { cwd, maxBuffer: 16 * 1024 * 1024 })
  return stdout
}

export async function gitDiffNameOnly(
  baseRef: string,
  repoRoot: string,
  execGit: ChangedEntitiesOptions["execGit"] = defaultExecGit,
): Promise<string[]> {
  const stdout = await execGit(["diff", "--name-only", `${baseRef}...HEAD`], repoRoot)
  return stdout
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export async function gitDiffForPath(
  baseRef: string,
  repoRoot: string,
  filePath: string,
  execGit: ChangedEntitiesOptions["execGit"] = defaultExecGit,
): Promise<string> {
  return execGit(["diff", `${baseRef}...HEAD`, "--", filePath], repoRoot)
}

export function collectChangedSlugsFromPatch(
  patch: string,
  entities: EntityRecord[],
): Set<string> {
  const slugs = new Set<string>()
  const byId = new Map(entities.map((entity) => [entity.id, entity]))
  const byDomain = new Map(
    entities.map((entity) => [entity.domain.toLowerCase(), entity]),
  )

  const idMatches = patch.matchAll(/^[+-].*\bid:\s*(\d+)/gm)
  for (const match of idMatches) {
    const entity = byId.get(Number.parseInt(match[1]!, 10))
    if (entity) slugs.add(entity.slug)
  }

  const domainMatches = patch.matchAll(/^[+-].*domain:\s*["']([^"']+)["']/gm)
  for (const match of domainMatches) {
    const entity = byDomain.get(match[1]!.toLowerCase())
    if (entity) slugs.add(entity.slug)
  }

  const slugMatches = patch.matchAll(/^[+-].*slug:\s*["']([^"']+)["']/gm)
  for (const match of slugMatches) {
    slugs.add(match[1]!)
  }

  const hostedMatches = patch.matchAll(/^[+-].*["']\/logos\/([^"'.]+)\./gm)
  for (const match of hostedMatches) {
    slugs.add(match[1]!)
  }

  const overrideDomainMatches = patch.matchAll(/^[+-]\s*"([^"]+)":\s*\{/gm)
  for (const match of overrideDomainMatches) {
    const entity = byDomain.get(match[1]!.toLowerCase())
    if (entity) slugs.add(entity.slug)
  }

  const jsonSlugMatches = patch.matchAll(/^[+-].*"slug":\s*"([^"]+)"/gm)
  for (const match of jsonSlugMatches) {
    slugs.add(match[1]!)
  }

  return slugs
}

export function slugFromHostedLogoPath(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, "/")
  const match = normalized.match(/^public\/logos\/([^/]+)\.[^/]+$/)
  return match?.[1] ?? null
}

export async function resolveChangedEntitySlugs(
  entities: EntityRecord[],
  options: ChangedEntitiesOptions,
): Promise<Set<string>> {
  const execGit = options.execGit ?? defaultExecGit
  const changedFiles = await gitDiffNameOnly(options.baseRef, options.repoRoot, execGit)
  const slugs = new Set<string>()

  for (const file of changedFiles) {
    const hostedSlug = slugFromHostedLogoPath(file)
    if (hostedSlug) {
      slugs.add(hostedSlug)
      continue
    }

    if (
      file === "lib/logos-data.ts" ||
      file === "data/logo-overrides.json" ||
      file.startsWith("data/logo-sources-")
    ) {
      const patch = await gitDiffForPath(options.baseRef, options.repoRoot, file, execGit)
      for (const slug of collectChangedSlugsFromPatch(patch, entities)) {
        slugs.add(slug)
      }
    }
  }

  return slugs
}

export function isBlockingFailure(
  slug: string,
  blockingSlugs: Set<string> | null,
): boolean {
  if (!blockingSlugs) return true
  return blockingSlugs.has(slug)
}

export function githubActionsWarning(message: string, title = "Logo check"): string {
  return `::warning title=${title}::${message.replace(/\n/g, " ")}`
}
