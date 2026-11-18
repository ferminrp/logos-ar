import type { APIRoute } from 'astro'
import { buildLlmsTxt } from '@/lib/llms-txt'
import { env } from 'cloudflare:workers'
import { resolveWorkerSiteUrl } from '@/lib/apply-home-discovery-headers'

export const prerender = false

export const GET: APIRoute = (context) => {
  const siteUrl = resolveWorkerSiteUrl(
    context.request,
    env as unknown as Record<string, unknown>,
  )

  return new Response(buildLlmsTxt(siteUrl), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}