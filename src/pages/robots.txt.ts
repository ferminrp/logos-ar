import type { APIRoute } from 'astro'
import { getSiteUrl } from '@/lib/site-url'

export const prerender = false

const cacheControl =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'

export const GET: APIRoute = () => {
  const body = `User-Agent: *
Allow: /
Content-Signal: search=yes, ai-train=no, ai-input=yes

Sitemap: ${getSiteUrl()}/sitemap.xml
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  })
}
