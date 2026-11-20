import redirects from '../data/permanent-redirects.json' with { type: 'json' }

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
  return Response.redirect(target.toString(), 308)
}