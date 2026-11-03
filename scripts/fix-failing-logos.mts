import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getAllEntities } from "../lib/entity-index.ts"
import { checkEntityLogos } from "../lib/logo-quality/check.ts"
import { getGoogleFaviconUrl } from "../lib/favicon-urls.ts"
import { MIN_LOGO_BYTES, MIN_LOGO_PX } from "../lib/logo-quality/constants.ts"
import { measureImage } from "../lib/logo-quality/image-metrics.ts"
import { discoverSiteLogoUrls } from "../lib/logo-quality/site-logo.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const overridesPath = path.resolve(__dirname, "../data/logo-overrides.json")

type Override = { logoUrl: string; logoSource: "google" | "site" | "wikimedia" | "hosted" }

function passes(bytes: Uint8Array): boolean {
  if (bytes.length < MIN_LOGO_BYTES) return false
  const { width, height } = measureImage(bytes)
  const maxDim = Math.max(width, height)
  if (maxDim > 0 && maxDim < MIN_LOGO_PX) return false
  return true
}

async function tryUrl(url: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "LogosArgentina-LogoFix/1.0" },
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) return null
    return new Uint8Array(await response.arrayBuffer())
  } catch {
    return null
  }
}

async function resolve(domain: string): Promise<Override | null> {
  const candidates: string[] = []
  for (const url of await discoverSiteLogoUrls(domain)) candidates.push(url)
  candidates.push(getGoogleFaviconUrl(domain, 256))

  for (const url of candidates) {
    const bytes = await tryUrl(url)
    if (bytes && passes(bytes)) {
      return {
        logoUrl: url,
        logoSource: url.includes("googleusercontent") || url.includes("gstatic") ? "google" : "site",
      }
    }
  }
  return null
}

async function main() {
  const entities = getAllEntities().map((e) => ({
    id: e.id,
    name: e.name,
    domain: e.domain,
    slug: e.slug,
    logoUrl: e.logoUrl,
    logoSource: e.logoSource,
  }))

  const results = await checkEntityLogos(entities, {
    publicDir: path.join(__dirname, "../public"),
    skipRedirectCheck: true,
  })
  const failing = results.filter((r) => !r.ok)
  const overrides = JSON.parse(await readFile(overridesPath, "utf8")) as Record<string, Override>

  let fixed = 0
  for (const failure of failing) {
    const entity = entities.find((e) => e.slug === failure.slug)
    if (!entity) continue
    delete overrides[entity.domain]
    const resolved = await resolve(entity.domain)
    if (resolved) {
      overrides[entity.domain] = resolved
      fixed++
      console.log(`fixed ${entity.domain}`)
    } else {
      console.warn(`still failing ${entity.domain}`)
    }
  }

  await writeFile(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`)
  console.log(`Updated overrides, fixed ${fixed}/${failing.length}`)
}

main()
