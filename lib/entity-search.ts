import type { Entity } from "./logos-data.ts"
import { slugify } from "./entity-index.ts"

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function queryTokens(rawQuery: string): string[] {
  return normalizeSearchText(rawQuery).split(/\s+/).filter(Boolean)
}

/** Every whitespace-separated token must appear in the haystack, in any order. */
export function textMatchesSearchQuery(text: string, rawQuery: string): boolean {
  const tokens = queryTokens(rawQuery)
  if (tokens.length === 0) return true
  const haystack = normalizeSearchText(text)
  return tokens.every((token) => haystack.includes(token))
}

export function getEntitySearchHaystack(
  entity: Pick<Entity, "name" | "domain" | "seoAliases" | "slug">,
): string {
  const slug = entity.slug?.trim() || slugify(entity.name)
  const parts = [entity.name, entity.domain, slug, ...(entity.seoAliases ?? [])]
  return normalizeSearchText(parts.join(" "))
}

type SearchableEntity = Pick<Entity, "name" | "domain" | "seoAliases"> & {
  searchText?: string
}

export function entityMatchesSearchQuery(
  entity: SearchableEntity,
  rawQuery: string,
): boolean {
  const tokens = queryTokens(rawQuery)
  if (tokens.length === 0) return true
  const haystack = entity.searchText ?? getEntitySearchHaystack(entity)
  return tokens.every((token) => haystack.includes(token))
}

/**
 * Relevance of a name for a query (higher is better): exact name, name prefix,
 * word-start match, then any other match. Callers sort stably by this score.
 */
export function searchRelevance(name: string, rawQuery: string): number {
  const query = normalizeSearchText(rawQuery).replace(/\s+/g, " ")
  if (!query) return 0
  const normalizedName = normalizeSearchText(name)
  if (normalizedName === query) return 3
  if (normalizedName.startsWith(query)) return 2
  if (` ${normalizedName}`.includes(` ${query}`)) return 1
  return 0
}

export function sortBySearchRelevance<T extends { name: string }>(
  items: T[],
  rawQuery: string,
): T[] {
  if (!normalizeSearchText(rawQuery)) return items
  return items
    .map((item, index) => ({ item, index, score: searchRelevance(item.name, rawQuery) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((row) => row.item)
}
