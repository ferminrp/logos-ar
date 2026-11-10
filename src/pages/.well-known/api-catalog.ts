import type { APIRoute } from 'astro'
import {
  API_CATALOG_CONTENT_TYPE,
  getApiCatalogPayload,
} from '@/lib/api-catalog'

export const prerender = false

export const GET: APIRoute = () =>
  new Response(JSON.stringify(getApiCatalogPayload()), {
    headers: {
      'Content-Type': API_CATALOG_CONTENT_TYPE,
      'Cache-Control':
        'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
