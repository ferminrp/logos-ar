import logosDataset from '../data/logos-dataset.json' with { type: 'json' }
import { entityRecordForLogoItem } from './mcp/entity-for-catalog-item.ts'

const HOSTED_LOGO_PATH = /^\/logos\/([a-z0-9-]+)\.(png|svg)$/

/** Slug from `catalog_logo_url` when the logo is self-hosted on `/logos/<slug>.{png,svg}`. */
export function slugFromHostedCatalogLogoUrl(
  catalogLogoUrl: string | undefined,
): string | null {
  if (!catalogLogoUrl) return null
  const match = HOSTED_LOGO_PATH.exec(catalogLogoUrl)
  return match?.[1] ?? null
}

let cachedDatasetHostedSlugs: ReadonlySet<string> | null = null
let cachedDatasetCatalogSlugs: ReadonlySet<string> | null = null

/** Every slug that appears in `data/logos-dataset.json` with a hosted catalog logo URL. */
export function logosDatasetHostedSlugSet(): ReadonlySet<string> {
  if (cachedDatasetHostedSlugs) {
    return cachedDatasetHostedSlugs
  }
  const slugs = new Set<string>()
  for (const item of logosDataset.items) {
    const slug = slugFromHostedCatalogLogoUrl(
      (item as { catalog_logo_url?: string }).catalog_logo_url,
    )
    if (slug) {
      slugs.add(slug)
    }
  }
  cachedDatasetHostedSlugs = slugs
  return slugs
}

/**
 * Slugs backed by `data/logos-dataset.json`: hosted `/logos/<slug>.{png,svg}` paths
 * plus entity slugs resolved from each catalog row (covers Google favicon-only rows).
 */
export function logosDatasetCatalogSlugSet(): ReadonlySet<string> {
  if (cachedDatasetCatalogSlugs) {
    return cachedDatasetCatalogSlugs
  }
  const slugs = new Set<string>()
  for (const item of logosDataset.items) {
    const fromUrl = slugFromHostedCatalogLogoUrl(
      (item as { catalog_logo_url?: string }).catalog_logo_url,
    )
    if (fromUrl) {
      slugs.add(fromUrl)
    }
    const entity = entityRecordForLogoItem(item)
    if (entity) {
      slugs.add(entity.slug)
    }
  }
  cachedDatasetCatalogSlugs = slugs
  return slugs
}