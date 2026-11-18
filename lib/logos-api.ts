import {
  queryLogosCatalog,
  type LogosCatalogResult,
} from '@/lib/logos-catalog'

const CACHE_CONTROL_FILTERED =
  'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
const CACHE_CONTROL_UNFILTERED =
  'public, max-age=0, s-maxage=31536000, stale-while-revalidate=31536000'

function catalogJsonBody(result: LogosCatalogResult) {
  const { hasSearchFilters, ...body } = result
  return body
}

export function handleLogosGet(request: Request): Response {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? undefined
  const domain = searchParams.get('domain') ?? undefined
  const category = searchParams.get('category') ?? undefined
  const offset = Number.parseInt(searchParams.get('offset') ?? '', 10)
  const limit = Number.parseInt(searchParams.get('limit') ?? '', 10)

  const result = queryLogosCatalog({
    q,
    domain,
    category,
    offset: Number.isNaN(offset) ? undefined : offset,
    limit: Number.isNaN(limit) ? undefined : limit,
  })

  return Response.json(catalogJsonBody(result), {
    headers: {
      'Cache-Control': result.hasSearchFilters
        ? CACHE_CONTROL_FILTERED
        : CACHE_CONTROL_UNFILTERED,
      'X-Logos-Dataset-Version': result.datasetVersion,
    },
  })
}