import redirects from '../data/permanent-redirects.json' with { type: 'json' }
import { PERMANENT_REDIRECT_HTTP_STATUS } from './permanent-redirect-status.ts'

const redirectMap = new Map(
  (redirects as { source: string; destination: string }[]).map((entry) => [
    entry.source,
    entry.destination,
  ]),
)

/** Apply slug consolidation redirects (includes `/logos/*` assets). */
export function maybePermanentSlugRedirect(request: Request): Response | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return null
  }

  const { pathname, search } = new URL(request.url)
  const destination = redirectMap.get(pathname)
  if (!destination) {
    return null
  }

  const target = new URL(destination, request.url)
  target.search = search
  return Response.redirect(target.toString(), PERMANENT_REDIRECT_HTTP_STATUS)
}