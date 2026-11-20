import isotiposMetadata from '../data/isotipos/metadata.json' with { type: 'json' }
import { logosDatasetHostedSlugSet } from './catalog-logo-slugs.ts'
import { isValidHostedLogoSlug, R2_LOGOS_PREFIX } from './hosted-logos-path.ts'

export type IsotipoRecord = {
  slug: string
  source_url: string
  source_type: string
  kind: string
  colors: string[]
  license_note: string
}

const datasetSlugSet = logosDatasetHostedSlugSet()

const bySlug = new Map<string, IsotipoRecord>()

for (const row of isotiposMetadata as IsotipoRecord[]) {
  if (!isValidHostedLogoSlug(row.slug)) continue
  if (!datasetSlugSet.has(row.slug)) continue
  bySlug.set(row.slug, row)
}

/** Slugs with a validated isotipo backed by a hosted catalog entry. */
export const ISOTIPO_SLUGS: ReadonlySet<string> = new Set(bySlug.keys())

export function getIsotipoRecord(slug: string): IsotipoRecord | undefined {
  return bySlug.get(slug)
}

export function hasCatalogIsotipo(slug: string): boolean {
  return ISOTIPO_SLUGS.has(slug)
}

/** Public CDN path (Worker / R2). */
export function publicIsotipoSvgPath(slug: string): string {
  return `/logos/${slug}/isotipo.svg`
}

/** Canonical object key in `loguitos-assets`. */
export function r2ObjectKeyForIsotipo(slug: string): string {
  return `${R2_LOGOS_PREFIX}${slug}/isotipo.svg`
}

/** Static asset fallback under `public/isotipos/` (mirrors data layout). */
export function assetsFallbackPathForIsotipo(slug: string): string {
  return `/isotipos/${slug}.svg`
}

export function catalogSlugSetForIsotipoSync(): ReadonlySet<string> {
  return datasetSlugSet
}