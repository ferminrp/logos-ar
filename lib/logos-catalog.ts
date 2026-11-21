import logosDataset from '../data/logos-dataset.json' with { type: 'json' }
import flagsDataset from '../data/flags-dataset.json' with { type: 'json' }
import {
  entityMatchesSearchQuery,
  sortBySearchRelevance,
  textMatchesSearchQuery,
} from './entity-search.ts'
import { entityRecordForLogoItem } from './mcp/entity-for-catalog-item.ts'
import {
  hasCatalogIsotipo,
  publicIsotipoSvgPath,
} from './isotipos-catalog.ts'

export type LogoCatalogItem = {
  name: string
  domain: string
  google_domain: string
  duck_domain: string
  categoryId: string
  categoryName: string
  /** Logo shown in the catalog: a hosted `/logos/<slug>.png` path or a remote favicon URL. */
  catalog_logo_url?: string
  logo_source?: string
  /** Internal search index; never part of the public response. */
  searchText?: string
  /** Slug of the brand page at `/logo/<slug>`. */
  slug?: string
  /** Present only when this brand has a hosted isotipo SVG at `/logos/<slug>/isotipo.svg`. */
  isotipoSvgUrl?: string
}

export type FlagCatalogItem = {
  code: string
  name: string
  svgUrl: string
  categoryId: string
  categoryName: string
}

export type CatalogItem = LogoCatalogItem | FlagCatalogItem

export const DEFAULT_CATALOG_LIMIT = 50
export const MAX_CATALOG_LIMIT = 200

export const KNOWN_CATEGORIES = new Set([
  ...logosDataset.items.map((item) => item.categoryId.toLowerCase()),
  'banderas',
])

export type LogosCatalogFilters = {
  q?: string
  domain?: string
  category?: string
  offset?: number
  limit?: number
}

export type LogosCatalogResult = {
  items: CatalogItem[]
  total: number
  hasMore: boolean
  datasetVersion: string
  filters: {
    q: string | null
    domain: string | null
    category: string | null
    limit: number
    offset: number
  }
  hasSearchFilters: boolean
}

function isFlagItem(item: CatalogItem): item is FlagCatalogItem {
  return 'code' in item
}

function withOptionalIsotipoUrl(item: CatalogItem): CatalogItem {
  if (isFlagItem(item)) {
    return item
  }
  const entity = entityRecordForLogoItem(item)
  if (!entity) {
    return item
  }
  return {
    ...item,
    slug: entity.slug,
    ...(hasCatalogIsotipo(entity.slug)
      ? { isotipoSvgUrl: publicIsotipoSvgPath(entity.slug) }
      : {}),
  }
}

function parsePositiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback
  return Number.isNaN(value) || value < 0 ? fallback : value
}

function parseLimit(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value) || value < 1) {
    return DEFAULT_CATALOG_LIMIT
  }
  return Math.min(value, MAX_CATALOG_LIMIT)
}

/** Public shape: drop the internal search index string. */
function toPublicItem(item: CatalogItem): CatalogItem {
  if (isFlagItem(item) || item.searchText === undefined) return item
  const { searchText: _searchText, ...rest } = item
  return rest
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

function matchesQuery(item: CatalogItem, q: string): boolean {
  if (!q) return true

  if (isFlagItem(item)) {
    return textMatchesSearchQuery(`${item.name} ${item.code}`, q)
  }

  return entityMatchesSearchQuery(item, q)
}

function matchesDomain(item: CatalogItem, domain: string): boolean {
  if (!domain) return true

  if (isFlagItem(item)) {
    return item.code.toLowerCase().includes(domain)
  }

  return item.domain.toLowerCase().includes(domain)
}

/**
 * Full filtered list (no pagination), best matches first when `q` is set.
 * An unknown category matches nothing.
 */
export function filterLogosCatalogItems(
  input: Pick<LogosCatalogFilters, 'q' | 'domain' | 'category'>,
): CatalogItem[] {
  const q = normalize(input.q)
  const domain = normalize(input.domain)
  const category = normalize(input.category)

  if (category && !KNOWN_CATEGORIES.has(category)) {
    return []
  }
  const hasKnownCategory = Boolean(category)
  const includeLogos = !hasKnownCategory || category !== 'banderas'
  const includeFlags = !hasKnownCategory || category === 'banderas'

  const allItems: CatalogItem[] = [
    ...(includeLogos ? logosDataset.items : []),
    ...(includeFlags ? flagsDataset.items : []),
  ]

  const filtered = allItems.filter((item) => {
    if (hasKnownCategory && item.categoryId.toLowerCase() !== category) {
      return false
    }

    if (!matchesQuery(item, q)) {
      return false
    }

    if (!matchesDomain(item, domain)) {
      return false
    }

    return true
  })

  return sortBySearchRelevance(filtered, q)
}

export function queryLogosCatalog(input: LogosCatalogFilters): LogosCatalogResult {
  const q = normalize(input.q)
  const domain = normalize(input.domain)
  const category = normalize(input.category)
  const offset = parsePositiveInt(input.offset, 0)
  const limit = parseLimit(input.limit)

  const filteredItems = filterLogosCatalogItems({
    q: input.q,
    domain: input.domain,
    category: input.category,
  })

  const pagedItems = filteredItems
    .slice(offset, offset + limit)
    .map((item) => toPublicItem(withOptionalIsotipoUrl(item)))
  const hasMore = offset + pagedItems.length < filteredItems.length
  const datasetVersion = `${logosDataset.version}:${flagsDataset.version}`
  const hasSearchFilters = Boolean(q || domain || category)

  return {
    items: pagedItems,
    total: filteredItems.length,
    hasMore,
    datasetVersion,
    hasSearchFilters,
    filters: {
      q: q || null,
      domain: domain || null,
      category: category || null,
      limit,
      offset,
    },
  }
}