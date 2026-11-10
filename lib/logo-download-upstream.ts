import { resolveEntityLogoUrl } from './entity-logo.ts'
import {
  getDuckDuckGoFaviconUrl,
  getGoogleFaviconUrl,
} from './favicon-urls.ts'
import { describeWorkerWasmDecodeRisk } from './logo-download-worker-budget.ts'
import { measureImage } from './logo-quality/image-metrics.ts'

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
  if (status === 403 || status === 429) {
    return true
  }
  return status >= 500 && status < 600
}

const NON_IMAGE_CONTENT_TYPE =
  /^(text\/|application\/json|application\/xml|application\/javascript)/i

/** Human-readable detail when HTTP succeeded but the body is not a logo. */
export function describeUnusableLogoBody(
  bytes: Uint8Array,
  contentType: string | null,
): string | null {
  if (bytes.byteLength === 0) {
    return 'empty body'
  }

  const mime = contentType?.split(';')[0]?.trim() ?? ''
  if (mime && NON_IMAGE_CONTENT_TYPE.test(mime)) {
    return `content-type ${mime}`
  }

  const metrics = measureImage(bytes)
  if (metrics.format === 'unknown') {
    return 'unrecognized image bytes'
  }

  return null
}

export type LogoUpstreamAttempt = {
  role: 'primary' | 'fallback'
  url: string
  status: number
  detail?: string
}

export type LogoUpstreamFetchResult = {
  response: Response
  attempts: LogoUpstreamAttempt[]
}

export function formatLogoUpstreamFailureReason(
  attempts: LogoUpstreamAttempt[],
): string {
  if (attempts.length === 0) {
    return 'upstream failed'
  }

  return attempts
    .map((attempt) => {
      const label = attempt.role === 'primary' ? 'primary' : 'fallback'
      const detail = attempt.detail ? ` (${attempt.detail})` : ''
      return `${label} HTTP ${attempt.status}${detail}`
    })
    .join('; ')
}

export type LogoUpstreamDecodeBudget = {
  targetPngSize: number
}

async function responseAsLogo(
  res: Response,
  decodeBudget?: LogoUpstreamDecodeBudget,
): Promise<
  | { ok: true; response: Response }
  | { ok: false; detail: string }
> {
  const bytes = new Uint8Array(await res.arrayBuffer())
  const unusable = describeUnusableLogoBody(
    bytes,
    res.headers.get('content-type'),
  )
  if (unusable) {
    return { ok: false, detail: unusable }
  }

  if (decodeBudget) {
    const metrics = measureImage(bytes)
    const wasmRisk = describeWorkerWasmDecodeRisk(
      bytes.byteLength,
      metrics,
      decodeBudget.targetPngSize,
    )
    if (wasmRisk) {
      return { ok: false, detail: wasmRisk }
    }
  }

  return {
    ok: true,
    response: new Response(bytes, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    }),
  }
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
  options?: { decodeBudget?: LogoUpstreamDecodeBudget },
): Promise<LogoUpstreamFetchResult> {
  const decodeBudget = options?.decodeBudget
  const plan = buildLogoSourcePlan(primaryLogoUrl, faviconDomain, size, ctx)
  const tried = new Set<string>()
  const attempts: LogoUpstreamAttempt[] = []

  const attempt = async (url: string): Promise<Response> => {
    if (primaryLogoUrl.startsWith('/') && url === plan.primaryUrl) {
      return fetchHostedPath(primaryLogoUrl, ctx)
    }
    return fetchAbsoluteUrl(url, ctx)
  }

  const primaryRes = await attempt(plan.primaryUrl)
  tried.add(plan.primaryUrl)

  if (primaryRes.ok) {
    const parsed = await responseAsLogo(primaryRes, decodeBudget)
    if (parsed.ok) {
      attempts.push({
        role: 'primary',
        url: plan.primaryUrl,
        status: primaryRes.status,
      })
      return { response: parsed.response, attempts }
    }
    attempts.push({
      role: 'primary',
      url: plan.primaryUrl,
      status: primaryRes.status,
      detail: parsed.detail,
    })
  } else {
    attempts.push({
      role: 'primary',
      url: plan.primaryUrl,
      status: primaryRes.status,
    })
  }

  const primaryAttempt = attempts[0]!
  const primaryStatus = primaryAttempt.status
  const primaryUnusable = Boolean(primaryAttempt.detail)

  if (
    !primaryUnusable &&
    !shouldFallbackToPublicFavicon(plan.primaryUrl, primaryStatus)
  ) {
    return { response: primaryRes, attempts }
  }

  for (const fallbackUrl of plan.fallbackUrls) {
    if (tried.has(fallbackUrl)) continue
    tried.add(fallbackUrl)
    const fallbackRes = await fetchAbsoluteUrl(fallbackUrl, ctx)

    if (fallbackRes.ok) {
      const parsed = await responseAsLogo(fallbackRes, decodeBudget)
      if (parsed.ok) {
        attempts.push({
          role: 'fallback',
          url: fallbackUrl,
          status: fallbackRes.status,
        })
        return { response: parsed.response, attempts }
      }
      attempts.push({
        role: 'fallback',
        url: fallbackUrl,
        status: fallbackRes.status,
        detail: parsed.detail,
      })
    } else {
      attempts.push({
        role: 'fallback',
        url: fallbackUrl,
        status: fallbackRes.status,
      })
    }
  }

  const primaryHttpStatus = attempts[0]?.status ?? 502
  const exhaustedStatus = primaryHttpStatus === 404 ? 404 : 502

  return {
    response: new Response('No se pudo obtener el logo', {
      status: exhaustedStatus,
    }),
    attempts,
  }
}
