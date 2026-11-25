import { getSiteUrl } from './site-url.ts'
import { resolvePermanentRedirectPath } from './worker-permanent-redirect.ts'

const PRODUCTION_HOSTS = new Set(['loguitos.app', 'www.loguitos.app'])

function canonicalOrigin(env: Record<string, unknown> = {}): string {
  const fromBinding =
    typeof env.PUBLIC_SITE_URL === 'string' && env.PUBLIC_SITE_URL.trim()
      ? env.PUBLIC_SITE_URL.trim()
      : typeof env.NEXT_PUBLIC_SITE_URL === 'string' && env.NEXT_PUBLIC_SITE_URL.trim()
        ? env.NEXT_PUBLIC_SITE_URL.trim()
        : null
  const raw = (fromBinding ?? getSiteUrl()).replace(/\/$/, '')
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return `${parsed.protocol}//${parsed.hostname}`
  } catch {
    return 'https://loguitos.app'
  }
}

function isProductionHostname(hostname: string, canonicalHost: string): boolean {
  const host = hostname.toLowerCase()
  if (PRODUCTION_HOSTS.has(host)) return true
  return host === canonicalHost || host === `www.${canonicalHost}`
}

/** 301 www→apex and http→https when the request hits the Worker on production hosts. */
export function maybeCanonicalRedirect(
  request: Request,
  env: Record<string, unknown> = {},
): Response | null {
  const requestUrl = new URL(request.url)
  const canonical = new URL(canonicalOrigin(env))
  const canonicalHost = canonical.hostname

  if (!isProductionHostname(requestUrl.hostname, canonicalHost)) {
    return null
  }

  const needsHttps = requestUrl.protocol === 'http:'
  const needsApex =
    requestUrl.hostname.toLowerCase() === `www.${canonicalHost}` ||
    requestUrl.hostname.toLowerCase() === 'www.loguitos.app'

  if (!needsHttps && !needsApex) {
    return null
  }

  const pathname = requestUrl.pathname
  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    return null
  }

  const target = new URL(canonical.origin)
  target.pathname = resolvePermanentRedirectPath(pathname)
  target.search = requestUrl.search

  if (
    requestUrl.protocol === target.protocol &&
    requestUrl.hostname.toLowerCase() === target.hostname.toLowerCase()
  ) {
    return null
  }

  return Response.redirect(target.toString(), 301)
}