import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getAllEntities } from "../lib/entity-index.ts"
import { getGoogleFaviconUrl, getDuckDuckGoFaviconUrl } from "../lib/favicon-urls.ts"
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
      headers: { "User-Agent": "LogosArgentina-LogoSync/1.0" },
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) return null
    return new Uint8Array(await response.arrayBuffer())
  } catch {
    return null
  }
}

async function resolveForEntity(domain: string, name: string): Promise<Override | null> {
  const candidates: { url: string; source: Override["logoSource"] }[] = []

  for (const url of await discoverSiteLogoUrls(domain)) {
    candidates.push({ url, source: "site" })
  }

  candidates.push(
    { url: getGoogleFaviconUrl(domain, 256), source: "google" },
    { url: getDuckDuckGoFaviconUrl(domain), source: "google" },
  )

  for (const candidate of candidates) {
    const bytes = await tryUrl(candidate.url)
    if (bytes && passes(bytes)) {
      return { logoUrl: candidate.url, logoSource: candidate.source }
    }
  }

  return null
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let index = 0
  async function run(): Promise<void> {
    while (index < items.length) {
      const current = index++
      results[current] = await worker(items[current]!)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => run()))
  return results
}

async function main() {
  const existing = JSON.parse(await readFile(overridesPath, "utf8")) as Record<string, Override>
  const entities = getAllEntities().filter((entity) => !entity.logoUrl && !existing[entity.domain])
  let added = 0

  await mapPool(entities, 10, async (entity) => {
    const googleBytes = await tryUrl(getGoogleFaviconUrl(entity.domain, 128))
    if (googleBytes && passes(googleBytes)) return

    const resolved = await resolveForEntity(entity.domain, entity.name)
    if (resolved) {
      existing[entity.domain] = resolved
      added++
      console.log(`override ${entity.domain} → ${resolved.logoSource}`)
    } else {
      console.warn(`no override for ${entity.domain} (${entity.name})`)
    }
  })

  await writeFile(overridesPath, `${JSON.stringify(existing, null, 2)}\n`)
  console.log(`Wrote ${Object.keys(existing).length} overrides (${added} new)`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
