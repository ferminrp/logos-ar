const ICON_REL_PATTERN =
  /<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)[^"']*["'][^>]*>/gi

function hrefFromLinkTag(tag: string): string | null {
  const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i)
  return hrefMatch?.[1] ?? null
}

function sizesFromLinkTag(tag: string): number {
  const sizesMatch = tag.match(/\bsizes=["']([^"']+)["']/i)
  if (!sizesMatch) return 0
  const parts = sizesMatch[1]!.split(/\s+/)
  let max = 0
  for (const part of parts) {
    const match = part.match(/^(\d+)x(\d+)$/)
    if (match) {
      max = Math.max(max, Number.parseInt(match[1]!, 10))
    }
  }
  return max
}

export function extractSiteLogoCandidates(html: string, baseUrl: string): string[] {
  const candidates: { url: string; score: number }[] = []

  for (const tag of html.match(ICON_REL_PATTERN) ?? []) {
    const href = hrefFromLinkTag(tag)
    if (!href) continue
    const url = new URL(href, baseUrl).href
    const sizeScore = sizesFromLinkTag(tag)
    const appleBonus = /apple-touch-icon/i.test(tag) ? 50 : 0
    candidates.push({ url, score: sizeScore + appleBonus })
  }

  const ogMatch = html.match(
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  )
  if (ogMatch?.[1]) {
    candidates.push({
      url: new URL(ogMatch[1], baseUrl).href,
      score: 40,
    })
  }

  for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    const src = match[1]!
    if (!/logo|brand|marca/i.test(src)) continue
    if (/banner|slide|carousel|footer/i.test(src)) continue
    candidates.push({
      url: new URL(src, baseUrl).href,
      score: 35,
    })
  }

  candidates.sort((a, b) => b.score - a.score)
  const seen = new Set<string>()
  const urls: string[] = []
  for (const candidate of candidates) {
    if (seen.has(candidate.url)) continue
    seen.add(candidate.url)
    urls.push(candidate.url)
  }
  return urls
}

export async function discoverSiteLogoUrls(
  domain: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  const baseUrl = `https://${domain.replace(/^https?:\/\//, "")}`
  try {
    const response = await fetchImpl(baseUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "LogosArgentina-LogoSync/1.0" },
    })
    if (!response.ok) return []
    const html = await response.text()
    return extractSiteLogoCandidates(html, response.url)
  } catch {
    return []
  }
}
