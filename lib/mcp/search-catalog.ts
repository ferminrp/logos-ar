import logosDataset from '../../data/logos-dataset.json' with { type: 'json' }
import flagsDataset from '../../data/flags-dataset.json' with { type: 'json' }
import {
  type CatalogItem,
  type LogosCatalogFilters,
  type LogosCatalogResult,
  filterLogosCatalogItems,
  queryLogosCatalog,
} from '../logos-catalog.ts'
import { sortBySearchRelevance } from '../entity-search.ts'
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
  return `logo:${item.name}\u0000${item.domain.toLowerCase()}\u0000${item.categoryId}`
}

function entitySlugMatchesQuery(slug: string, slugQuery: string): boolean {
  if (!slugQuery) return false
  const normalizedSlug = slug.toLowerCase()
  const normalizedQuery = slugQuery.toLowerCase()
  return normalizedSlug === normalizedQuery || normalizedSlug.includes(normalizedQuery)
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

  const datasetVersion = `${logosDataset.version}:${flagsDataset.version}`

  const merged: CatalogItem[] = []

  for (const item of filterLogosCatalogItems({
    q: input.q,
    domain: input.domain,
    category: input.category,
  })) {
    merged.push(item)
  }

  const seen = new Set(merged.map((item) => catalogItemKey(item)))

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

  const ranked = sortBySearchRelevance(merged, input.q ?? '')

  const total = ranked.length
  const items = ranked.slice(offset, offset + limit)
  const hasMore = offset + items.length < total

  const filterQ = (input.q ?? '').trim().toLowerCase() || null
  const filterDomain = (input.domain ?? '').trim().toLowerCase() || null
  const filterCategory = (input.category ?? '').trim().toLowerCase() || null

  return {
    items,
    total,
    hasMore,
    datasetVersion,
    hasSearchFilters: true,
    filters: {
      q: filterQ,
      domain: filterDomain,
      category: filterCategory,
      limit,
      offset,
    },
  }
}