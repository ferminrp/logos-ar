import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { handleLogoDownloadGet } from '@/lib/logo-download-api'

export const prerender = false

export const GET: APIRoute = ({ request }) => {
  return handleLogoDownloadGet(request, {
    origin: new URL(request.url).origin,
    assets: env.ASSETS,
  })
}
