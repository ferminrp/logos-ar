import redirects from '../data/permanent-redirects.json' with { type: 'json' }
import { PERMANENT_REDIRECT_HTTP_STATUS } from './permanent-redirect-status.ts'

const redirectMap = new Map(
  (redirects as { source: string; destination: string }[]).map((entry) => [
    entry.source,
    entry.destination,
  ]),
)

/** Normalize paths before permanent redirect lookup (`trailingSlash: never`). */
export function normalizePathnameForPermanentRedirect(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function getPermanentRedirectDestination(pathname: string): string | null {
  const normalized = normalizePathnameForPermanentRedirect(pathname)
  return redirectMap.get(normalized) ?? null
}

/** Path after slug consolidation redirects, if any (for canonical host fixes in one hop). */
export function resolvePermanentRedirectPath(pathname: string): string {
  const normalized = normalizePathnameForPermanentRedirect(pathname)
  return redirectMap.get(normalized) ?? normalized
}

/** Apply slug consolidation redirects (includes `/logos/*` assets). */
export function maybePermanentSlugRedirect(request: Request): Response | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return null
  }

  const { pathname, search } = new URL(request.url)
  const destination = getPermanentRedirectDestination(pathname)
  if (!destination) {
    return null
  }

  const target = new URL(destination, request.url)
  target.search = search
  return Response.redirect(target.toString(), PERMANENT_REDIRECT_HTTP_STATUS)
}