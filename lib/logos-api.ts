import {
  KNOWN_CATEGORIES,
  queryLogosCatalog,
  type CatalogItem,
  type LogosCatalogResult,
} from './logos-catalog.ts'
import { getSiteUrl } from './site-url.ts'

const CACHE_CONTROL_FILTERED =
  'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
// The URL is not versioned, so a shared cache must not pin the catalog for long.
const CACHE_CONTROL_UNFILTERED =
  'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'

/** The catalog is public read-only data: any origin may read it from a browser. */
export const PUBLIC_API_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Expose-Headers': 'X-Logos-Dataset-Version',
}

/** Hosted assets are stored as site-relative paths; the API always answers absolute URLs. */
function withAbsoluteUrls(item: CatalogItem, siteUrl: string): CatalogItem {
  if ('code' in item) return item
  const absolute = (value: string | undefined) =>
    value?.startsWith('/') ? `${siteUrl}${value}` : value
  return {
    ...item,
    ...(item.catalog_logo_url
      ? { catalog_logo_url: absolute(item.catalog_logo_url) }
      : {}),
    ...(item.isotipoSvgUrl ? { isotipoSvgUrl: absolute(item.isotipoSvgUrl) } : {}),
    ...(item.slug ? { pageUrl: `${siteUrl}/logo/${item.slug}` } : {}),
  }
}

function catalogJsonBody(result: LogosCatalogResult) {
  const { hasSearchFilters: _hasSearchFilters, items, ...body } = result
  const siteUrl = getSiteUrl().replace(/\/$/, '')
  return { ...body, items: items.map((item) => withAbsoluteUrls(item, siteUrl)) }
}

export function handlePublicApiOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...PUBLIC_API_CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
      Allow: 'GET, HEAD, OPTIONS',
    },
  })
}

export function handleLogosGet(request: Request): Response {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? undefined
  const domain = searchParams.get('domain') ?? undefined
  const category = searchParams.get('category') ?? undefined
  const offset = Number.parseInt(searchParams.get('offset') ?? '', 10)
  const limit = Number.parseInt(searchParams.get('limit') ?? '', 10)

  const normalizedCategory = category?.trim().toLowerCase()
  if (normalizedCategory && !KNOWN_CATEGORIES.has(normalizedCategory)) {
    return Response.json(
      {
        error: `Categoría desconocida: ${category}`,
        knownCategories: [...KNOWN_CATEGORIES].sort(),
      },
      {
        status: 400,
        headers: { ...PUBLIC_API_CORS_HEADERS, 'Cache-Control': 'no-store' },
      },
    )
  }

  const result = queryLogosCatalog({
    q,
    domain,
    category,
    offset: Number.isNaN(offset) ? undefined : offset,
    limit: Number.isNaN(limit) ? undefined : limit,
  })

  return Response.json(catalogJsonBody(result), {
    headers: {
      ...PUBLIC_API_CORS_HEADERS,
      'Cache-Control': result.hasSearchFilters
        ? CACHE_CONTROL_FILTERED
        : CACHE_CONTROL_UNFILTERED,
      'X-Logos-Dataset-Version': result.datasetVersion,
    },
  })
}
