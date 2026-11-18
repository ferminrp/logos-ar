import type { EntityRecord } from '../entity-index.ts'
import { getAllEntities } from '../entity-index.ts'
import type { LogoCatalogItem } from '../logos-catalog.ts'

export function entityRecordForLogoItem(
  item: LogoCatalogItem,
): EntityRecord | null {
  const domain = item.domain.toLowerCase()
  return (
    getAllEntities().find(
      (entity) =>
        entity.name === item.name && entity.domain.toLowerCase() === domain,
    ) ?? null
  )
}