import { getAllEntities, getEntityBySlug } from '../entity-index.ts'
import type { CatalogItem, FlagCatalogItem } from '../logos-catalog.ts'
import { categories } from '../logos-data.ts'
import flagsDataset from '../../data/flags-dataset.json' with { type: 'json' }
import { FLAGS_CATEGORY, flagsTotalCount } from '../flags-data.ts'
import { entityRecordForLogoItem } from './entity-for-catalog-item.ts'

const DEFAULT_DOWNLOAD_SIZE = 256

function isFlagItem(item: CatalogItem): item is FlagCatalogItem {
  return 'code' in item
}

export function absoluteLogoDownloadUrl(
  siteUrl: string,
  domain: string,
  format: 'png' | 'svg',
): string {
  const params = new URLSearchParams({
    domain,
    format,
    size: String(DEFAULT_DOWNLOAD_SIZE),
  })
  return `${siteUrl}/api/logo-download?${params.toString()}`
}

export function entityToMcpLogo(siteUrl: string, entity: EntityRecord) {
  return {
    found: true as const,
    name: entity.name,
    slug: entity.slug,
    domain: entity.domain,
    categoryId: entity.categoryId,
    categoryName: entity.categoryName,
    pageUrl: `${siteUrl}/logo/${entity.slug}`,
    pngUrl: absoluteLogoDownloadUrl(siteUrl, entity.domain, 'png'),
    svgUrl: absoluteLogoDownloadUrl(siteUrl, entity.domain, 'svg'),
    ui: siteUrl,
  }
}

export function flagToMcpLogo(siteUrl: string, flag: FlagCatalogItem) {
  return {
    found: true as const,
    name: flag.name,
    slug: flag.code.toLowerCase(),
    code: flag.code,
    categoryId: flag.categoryId,
    categoryName: flag.categoryName,
    pageUrl: `${siteUrl}/categoria/banderas`,
    pngUrl: null,
    svgUrl: flag.svgUrl,
    ui: siteUrl,
  }
}

export function catalogItemToMcpSummary(siteUrl: string, item: CatalogItem) {
  if (isFlagItem(item)) {
    return {
      name: item.name,
      slug: item.code.toLowerCase(),
      code: item.code,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      pageUrl: `${siteUrl}/categoria/banderas`,
      pngUrl: null,
      svgUrl: item.svgUrl,
    }
  }

  const entity = entityRecordForLogoItem(item)

  const slug = entity?.slug
  const pageUrl = slug ? `${siteUrl}/logo/${slug}` : null

  return {
    name: item.name,
    slug: slug ?? null,
    domain: item.domain,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    pageUrl,
    pngUrl: absoluteLogoDownloadUrl(siteUrl, item.domain, 'png'),
    svgUrl: absoluteLogoDownloadUrl(siteUrl, item.domain, 'svg'),
  }
}

export function resolveLogoBySlugOrName(
  siteUrl: string,
  slugOrName: string,
): ReturnType<typeof entityToMcpLogo> | ReturnType<typeof flagToMcpLogo> | { found: false; query: string } {
  const trimmed = slugOrName.trim()
  if (!trimmed) {
    return { found: false, query: slugOrName }
  }

  const bySlug = getEntityBySlug(trimmed.toLowerCase())
  if (bySlug) {
    return entityToMcpLogo(siteUrl, bySlug)
  }

  const normalized = trimmed.toLowerCase()
  const entity =
    getAllEntities().find(
      (row) =>
        row.name.toLowerCase() === normalized ||
        row.domain.toLowerCase() === normalized ||
        row.slug === normalized,
    ) ?? null

  if (entity) {
    return entityToMcpLogo(siteUrl, entity)
  }

  const flag =
    flagsDataset.items.find(
      (row) =>
        row.code.toLowerCase() === normalized ||
        row.name.toLowerCase() === normalized,
    ) ?? null

  if (flag) {
    return flagToMcpLogo(siteUrl, flag)
  }

  return { found: false, query: trimmed }
}

export function listCategoryMeta() {
  return [
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      entityCount: category.entities.length,
      pageUrl: `/categoria/${category.id}`,
    })),
    {
      id: FLAGS_CATEGORY.id,
      name: FLAGS_CATEGORY.name,
      entityCount: flagsTotalCount,
      pageUrl: `/categoria/banderas`,
    },
  ]
}