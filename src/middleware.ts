import { defineMiddleware } from 'astro:middleware'
import permanentRedirects from '../data/permanent-redirects.json'
import { prefersMarkdown } from '@/lib/accept'
import { GONE_LOGO_SLUGS } from '@/lib/gone-logo-slugs'
import { getMarkdownForPath } from '@/lib/site-markdown'
import { applyHomeDiscoveryHeaders } from '@/lib/apply-home-discovery-headers'
import { getSiteUrl } from '@/lib/site-url'

const NEGOTIABLE_PATHS = new Set(['/', '/categorias'])

const redirectMap = new Map(
  permanentRedirects.map((entry: { source: string; destination: string }) => [
    entry.source,
    entry.destination,
  ]),
)

const SITEMAP_CACHE_CONTROL =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'

const ROBOTS_CACHE_CONTROL = SITEMAP_CACHE_CONTROL

function withResponseHeaders(
  response: Response,
  extra: Record<string, string>,
): Response {
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(extra)) {
    headers.set(name, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  const goneLogoMatch = /^\/logo\/([^/]+)\/?$/.exec(pathname)
  if (goneLogoMatch?.[1] && GONE_LOGO_SLUGS.has(goneLogoMatch[1])) {
    return new Response('Not Found', { status: 404 })
  }

  const destination = redirectMap.get(pathname)

  if (destination) {
    return context.redirect(destination, 308)
  }

  if (NEGOTIABLE_PATHS.has(pathname)) {
    const accept = context.request.headers.get('accept')
    if (prefersMarkdown(accept)) {
      const markdown = getMarkdownForPath(pathname)
      if (markdown) {
        return new Response(markdown, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            Vary: 'Accept',
            'Cache-Control':
              'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          },
        })
      }
    }
  }

  let response = await next()

  if (pathname === '/') {
    response = applyHomeDiscoveryHeaders(response, {
      pathname,
      siteUrl: getSiteUrl(),
    })
  }

  if (pathname === '/sitemap.xml') {
    response = withResponseHeaders(response, {
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    })
  }

  if (pathname === '/robots.txt') {
    response = withResponseHeaders(response, {
      'Cache-Control': ROBOTS_CACHE_CONTROL,
    })
  }

  return response
})
