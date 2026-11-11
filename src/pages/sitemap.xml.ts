import type { APIRoute } from 'astro'
import { getSitemapEntries } from '@/lib/sitemap-entries'
import { serializeSitemapXml } from '@/lib/sitemap-xml'

export const prerender = false

const cacheControl =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'

export const GET: APIRoute = () => {
  const xml = serializeSitemapXml(getSitemapEntries())
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  })
}
