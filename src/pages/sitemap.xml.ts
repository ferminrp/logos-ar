import type { APIRoute } from 'astro'
import { getSitemapEntries } from '@/lib/sitemap-entries'
import { serializeSitemapXml } from '@/lib/sitemap-xml'

export const prerender = false

export const GET: APIRoute = () => {
  const xml = serializeSitemapXml(getSitemapEntries())
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
