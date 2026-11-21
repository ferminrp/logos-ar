export interface CurlConfig {
  size: number
  outputFormat: "png" | "ico" | "original"
  includeHeaders: boolean
}

export const defaultCurlConfig: CurlConfig = {
  size: 128,
  outputFormat: "original",
  includeHeaders: false,
}

/** Google s2 serves at most 256px; anything larger silently falls back to a 16px icon. */
export const GOOGLE_FAVICON_MAX_SIZE = 256

export function getGoogleFaviconUrl(domain: string, size: number = 128): string {
  const sz = Math.min(Math.max(Math.trunc(size) || 128, 16), GOOGLE_FAVICON_MAX_SIZE)
  return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=${sz}`
}

export function getDuckDuckGoFaviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

/** Domains to try for public favicon proxies (www strip + logo URL host). */
export function collectFaviconDomainCandidates(
  faviconDomain: string,
  primaryLogoUrl: string,
): string[] {
  const ordered: string[] = []
  const seen = new Set<string>()
  const push = (domain: string) => {
    const normalized = domain.trim().toLowerCase()
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    ordered.push(normalized)
  }

  push(faviconDomain)
  if (faviconDomain.toLowerCase().startsWith('www.')) {
    push(faviconDomain.slice(4))
  }

  try {
    const host = new URL(primaryLogoUrl).hostname.toLowerCase()
    push(host)
    if (host.startsWith('www.')) {
      push(host.slice(4))
    }
  } catch {
    // ignore relative / invalid URLs
  }

  return ordered
}

export function getGoogleCurl(
  domain: string,
  config: CurlConfig = defaultCurlConfig
): string {
  const url = getGoogleFaviconUrl(domain, config.size)
  const ext = config.outputFormat === "original" ? "png" : config.outputFormat
  const filename = `${domain.replace(/\./g, "_")}_favicon.${ext}`
  const headers = config.includeHeaders ? " -I" : ""
  return `curl${headers} "${url}" -o ${filename}`
}

export function getDuckDuckGoCurl(
  domain: string,
  config: CurlConfig = defaultCurlConfig
): string {
  const url = getDuckDuckGoFaviconUrl(domain)
  const ext = config.outputFormat === "original" ? "ico" : config.outputFormat
  const filename = `${domain.replace(/\./g, "_")}_favicon.${ext}`
  const headers = config.includeHeaders ? " -I" : ""
  return `curl${headers} "${url}" -o ${filename}`
}

export function getSheetsImageFormula(googleUrl: string): string {
  return `=IMAGE("${googleUrl}")`
}
