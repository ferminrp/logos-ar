import type { APIRoute } from 'astro'
import { CORS_HEADERS, mcpWellKnownDocument } from '@/lib/mcp/http'
import { env } from 'cloudflare:workers'
import { resolveWorkerSiteUrl } from '@/lib/apply-home-discovery-headers'

export const prerender = false

function siteUrl(context: Parameters<APIRoute>[0]): string {
  return resolveWorkerSiteUrl(
    context.request,
    env as unknown as Record<string, unknown>,
  )
}

export const GET: APIRoute = (context) => {
  const body = JSON.stringify(mcpWellKnownDocument(siteUrl(context)))
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    status: 204,
    headers: { ...CORS_HEADERS, Allow: 'GET, OPTIONS' },
  })