import { buildHomeLinkHeader } from './home-discovery-link.ts'
import { HOME_DOCUMENT_CACHE_CONTROL } from './home-document-headers.ts'
import { getSiteUrl } from './site-url.ts'

/** Site URL for Worker responses (preview aliases, custom domains, env override). */
export function resolveWorkerSiteUrl(
  request: Request,
  env: Record<string, unknown> = {},
): string {
  const fromBinding =
    typeof env.PUBLIC_SITE_URL === 'string' && env.PUBLIC_SITE_URL.trim()
      ? env.PUBLIC_SITE_URL.trim()
      : typeof env.NEXT_PUBLIC_SITE_URL === 'string' && env.NEXT_PUBLIC_SITE_URL.trim()
        ? env.NEXT_PUBLIC_SITE_URL.trim()
        : null
  if (fromBinding) return fromBinding.replace(/\/$/, '')
  try {
    return new URL(request.url).origin
  } catch {
    return getSiteUrl().replace(/\/$/, '')
  }
}

export function applyHomeDiscoveryHeaders(
  response: Response,
  options: { pathname: string; siteUrl?: string },
): Response {
  if (options.pathname !== '/' || !response.ok) return response

  const headers = new Headers(response.headers)
  if (!headers.has('link')) {
    headers.set('Link', buildHomeLinkHeader(options.siteUrl))
  }
  if (!headers.has('cache-control')) {
    headers.set('Cache-Control', HOME_DOCUMENT_CACHE_CONTROL)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
