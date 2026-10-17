import { getGoogleFaviconUrl } from "../lib/favicon-urls.ts"
import { MIN_LOGO_BYTES, MIN_LOGO_PX } from "../lib/logo-quality/constants.ts"
import { measureImage } from "../lib/logo-quality/image-metrics.ts"
import { discoverSiteLogoUrls } from "../lib/logo-quality/site-logo.ts"

function passes(bytes: Uint8Array): boolean {
  if (bytes.length < MIN_LOGO_BYTES) return false
  const { width, height } = measureImage(bytes)
  const maxDim = Math.max(width, height)
  if (maxDim > 0 && maxDim < MIN_LOGO_PX) return false
  return true
}

async function tryUrl(url: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) return null
    return new Uint8Array(await response.arrayBuffer())
  } catch {
    return null
  }
}

export async function vetDomain(domain: string): Promise<boolean> {
  for (const url of await discoverSiteLogoUrls(domain)) {
    const bytes = await tryUrl(url)
    if (bytes && passes(bytes)) return true
  }
  const google = await tryUrl(getGoogleFaviconUrl(domain, 256))
  return Boolean(google && passes(google))
}

const domains = process.argv.slice(2)
for (const domain of domains) {
  const ok = await vetDomain(domain)
  console.log(ok ? "PASS" : "FAIL", domain)
}
