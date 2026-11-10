import { resolveEntityLogoUrl } from './entity-logo.ts'
import {
  getDuckDuckGoFaviconUrl,
  getGoogleFaviconUrl,
} from './favicon-urls.ts'

const UPSTREAM_HEADERS: HeadersInit = {
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (compatible; LoguitosBot/1.0; +https://loguitos.app)',
}

/** Outbound logo fetches; slow origins fall back to public favicon proxies. */
export const UPSTREAM_FETCH_TIMEOUT_MS = 20_000

export type LogoAssetsBinding = {
  fetch: (request: Request | string | URL) => Promise<Response>
}

export type LogoDownloadContext = {
  origin: string
  assets?: LogoAssetsBinding
}

export function requestOrigin(request: Request): string {
  return new URL(request.url).origin
}

function isGoogleFaviconUrl(url: string): boolean {
  return url.includes('googleusercontent.com/s2/favicons')
}

function isDuckDuckGoFaviconUrl(url: string): boolean {
  return url.includes('icons.duckduckgo.com/ip3/')
}

export function shouldFallbackToPublicFavicon(
  primaryUrl: string,
  status: number,
): boolean {
  if (isGoogleFaviconUrl(primaryUrl) || isDuckDuckGoFaviconUrl(primaryUrl)) {
    return false
  }
  if (status === 404) {
    return true
  }
  return status === 403 || status === 429 || status >= 502
}

async function fetchAbsoluteUrl(
  url: string,
  ctx: LogoDownloadContext,
): Promise<Response> {
  const parsed = new URL(url)
  const sameOrigin = parsed.origin === ctx.origin
  const isHostedAsset =
    sameOrigin && parsed.pathname.startsWith('/logos/')

  try {
    if (isHostedAsset && ctx.assets) {
      return await ctx.assets.fetch(
        new Request(parsed.toString(), { method: 'GET' }),
      )
    }

    return await fetch(parsed, {
      headers: UPSTREAM_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return new Response(reason, { status: 502 })
  }
}

async function fetchHostedPath(
  logoPath: string,
  ctx: LogoDownloadContext,
): Promise<Response> {
  const absolute = resolveEntityLogoUrl(logoPath, `${ctx.origin}/`)
  return fetchAbsoluteUrl(absolute, ctx)
}

export type LogoSourcePlan = {
  primaryUrl: string
  fallbackUrls: string[]
}

export function buildLogoSourcePlan(
  primaryLogoUrl: string,
  faviconDomain: string,
  size: number,
  ctx: LogoDownloadContext,
): LogoSourcePlan {
  const primaryUrl = resolveEntityLogoUrl(primaryLogoUrl, `${ctx.origin}/`)

  const fallbackUrls: string[] = []
  const googleUrl = getGoogleFaviconUrl(faviconDomain, size)
  if (primaryUrl !== googleUrl) {
    fallbackUrls.push(googleUrl)
  }
  const ddgUrl = getDuckDuckGoFaviconUrl(faviconDomain)
  if (!fallbackUrls.includes(ddgUrl) && primaryUrl !== ddgUrl) {
    fallbackUrls.push(ddgUrl)
  }

  return { primaryUrl, fallbackUrls }
}

export async function fetchLogoUpstream(
  primaryLogoUrl: string,
  faviconDomain: string,
  size: number,
  ctx: LogoDownloadContext,
): Promise<Response> {
  const plan = buildLogoSourcePlan(primaryLogoUrl, faviconDomain, size, ctx)
  const tried = new Set<string>()

  const attempt = async (url: string): Promise<Response> => {
    if (primaryLogoUrl.startsWith('/') && url === plan.primaryUrl) {
      return fetchHostedPath(primaryLogoUrl, ctx)
    }
    return fetchAbsoluteUrl(url, ctx)
  }

  let primaryRes = await attempt(plan.primaryUrl)
  tried.add(plan.primaryUrl)

  if (primaryRes.ok) {
    return primaryRes
  }

  if (!shouldFallbackToPublicFavicon(plan.primaryUrl, primaryRes.status)) {
    return primaryRes
  }

  for (const fallbackUrl of plan.fallbackUrls) {
    if (tried.has(fallbackUrl)) continue
    tried.add(fallbackUrl)
    const fallbackRes = await fetchAbsoluteUrl(fallbackUrl, ctx)
    if (fallbackRes.ok) {
      return fallbackRes
    }
  }

  return primaryRes
}
