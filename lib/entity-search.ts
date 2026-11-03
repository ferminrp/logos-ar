import type { Entity } from "./logos-data.ts"

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export function getEntitySearchHaystack(
  entity: Pick<Entity, "name" | "domain" | "seoAliases">,
): string {
  const parts = [entity.name, entity.domain, ...(entity.seoAliases ?? [])]
  return normalizeSearchText(parts.join(" "))
}

export function entityMatchesSearchQuery(
  entity: Pick<Entity, "name" | "domain" | "seoAliases">,
  rawQuery: string,
): boolean {
  const query = normalizeSearchText(rawQuery)
  if (!query) return true
  return getEntitySearchHaystack(entity).includes(query)
}
