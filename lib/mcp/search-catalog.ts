import logosDataset from '../../data/logos-dataset.json' with { type: 'json' }
import {
  MAX_CATALOG_LIMIT,
  type CatalogItem,
  type LogosCatalogFilters,
  type LogosCatalogResult,
  queryLogosCatalog,
} from '../logos-catalog.ts'
import { entityRecordForLogoItem } from './entity-for-catalog-item.ts'

export function normalizeMcpSlugQuery(q: string): string {
  const trimmed = q.trim().toLowerCase()
  if (!trimmed) return ''
  const fromPath = /(?:^|\/)logo\/([^/?#\s]+)/.exec(trimmed)
  if (fromPath?.[1]) return fromPath[1]
  return trimmed
}

function catalogItemKey(item: CatalogItem): string {
  if ('code' in item) return `flag:${item.code}`
  return `logo:${item.name}\u0000${item.domain.toLowerCase()}`
}

function entitySlugMatchesQuery(slug: string, slugQuery: string): boolean {
  if (!slugQuery) return false
  return slug === slugQuery || slug.includes(slugQuery) || slugQuery.includes(slug)
}

function logoItemMatchesCategory(
  category: string | undefined,
  categoryId: string,
): boolean {
  if (!category?.trim()) return true
  return categoryId.toLowerCase() === category.trim().toLowerCase()
}

/**
 * MCP-only catalog search: same as queryLogosCatalog, plus optional slug /logo/… matching.
 * Does not affect GET /api/logos.
 */
export function queryMcpLogosCatalog(
  input: LogosCatalogFilters,
): LogosCatalogResult {
  const slugQuery = normalizeMcpSlugQuery(input.q ?? '')
  if (!slugQuery) {
    return queryLogosCatalog(input)
  }

  const offset = input.offset ?? 0
  const limit = input.limit ?? 50
  const category = input.category

  const nameSearch = queryLogosCatalog({
    q: input.q,
    domain: input.domain,
    category: input.category,
    offset: 0,
    limit: MAX_CATALOG_LIMIT,
  })

  const merged: CatalogItem[] = []
  const seen = new Set<string>()

  for (const item of nameSearch.items) {
    const key = catalogItemKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
  }

  for (const item of logosDataset.items) {
    if (!logoItemMatchesCategory(category, item.categoryId)) continue
    const entity = entityRecordForLogoItem(item)
    if (!entity || !entitySlugMatchesQuery(entity.slug, slugQuery)) continue
    if (input.domain?.trim()) {
      const needle = input.domain.trim().toLowerCase()
      if (!item.domain.toLowerCase().includes(needle)) continue
    }
    const key = catalogItemKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
  }

  merged.sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const total = merged.length
  const items = merged.slice(offset, offset + limit)
  const hasMore = offset + items.length < total

  return {
    items,
    total,
    hasMore,
    datasetVersion: nameSearch.datasetVersion,
    hasSearchFilters: true,
    filters: {
      ...nameSearch.filters,
      limit,
      offset,
    },
  }
}