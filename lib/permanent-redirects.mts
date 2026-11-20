import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getEntitySlugRedirects } from "./entity-index.ts"

export type PermanentRedirect = {
  source: string
  destination: string
  permanent: true
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const CATEGORY_REDIRECTS: PermanentRedirect[] = [
  {
    source: "/categoria/delivery",
    destination: "/categoria/gastronomia",
    permanent: true,
  },
]

/** Only emit asset redirects whose destination is served (avoids 404→404 chains). */
export function permanentRedirectTargetExists(destination: string): boolean {
  if (
    destination.startsWith("/logo/") ||
    destination.startsWith("/categoria/")
  ) {
    return true
  }

  const flat = /^\/logos\/([^/]+)\.(png|svg)$/.exec(destination)
  if (flat) {
    return existsSync(
      path.join(repoRoot, "public/logos", `${flat[1]}.${flat[2]}`),
    )
  }

  const isotipo = /^\/logos\/([^/]+)\/isotipo\.svg$/.exec(destination)
  if (isotipo) {
    const slug = isotipo[1]
    return (
      existsSync(path.join(repoRoot, "public/isotipos", `${slug}.svg`)) ||
      existsSync(path.join(repoRoot, "data/isotipos", `${slug}.svg`))
    )
  }

  return false
}

export function getPermanentRedirects(): PermanentRedirect[] {
  const all = [...getEntitySlugRedirects(), ...CATEGORY_REDIRECTS]
  return all.filter((entry) =>
    permanentRedirectTargetExists(entry.destination),
  )
}