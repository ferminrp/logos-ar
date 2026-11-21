import type { EntityRecord } from '../entity-index.ts'
import { getAllEntities } from '../entity-index.ts'
import type { LogoCatalogItem } from '../logos-catalog.ts'

export function entityRecordForLogoItem(
  item: LogoCatalogItem,
): EntityRecord | null {
  const domain = item.domain.toLowerCase()
  const candidates = getAllEntities().filter(
    (entity) =>
      entity.name === item.name && entity.domain.toLowerCase() === domain,
  )
  // The same brand can be listed in two categories under different slugs.
  return (
    candidates.find((entity) => entity.categoryId === item.categoryId) ??
    candidates[0] ??
    null
  )
}