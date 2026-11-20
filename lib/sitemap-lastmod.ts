/**
 * Real `<lastmod>` for the sitemap.
 *
 * Each URL gets a content fingerprint (catalog data, SEO copy, logo file bytes and a
 * template version). `data/sitemap-lastmod.json` stores the fingerprint next to the date
 * it last changed, so a deploy only bumps `lastmod` for pages whose content changed.
 * Node-only (crypto + fs): used by scripts and tests, never bundled into the Worker.
 */
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { getCategorySeoCopy } from "./category-seo.ts"
import { getAllEntities, getRelatedEntities, type EntityRecord } from "./entity-index.ts"
import { getEntityLogoUrl } from "./entity-logo.ts"
import { buildEntityMetaDescription, getEntityPageTitle } from "./entity-seo.ts"
import { FLAGS_CATEGORY, flagsDatasetVersion } from "./flags-data.ts"
import { GONE_LOGO_SLUGS } from "./gone-logo-slugs.ts"
import { guides } from "./guide-data.ts"
import { categories } from "./logos-data.ts"
import { HOME_DESCRIPTION, HOME_TITLE } from "./site-brand.ts"

/**
 * Bump the matching number when a page template changes in a way search engines
 * should re-crawl (new sections, structured data, copy). Data changes are detected
 * automatically.
 */
export const PAGE_TEMPLATE_VERSIONS = {
  home: 1,
  categorias: 1,
  docs: 1,
  category: 1,
  banderas: 1,
  logo: 1,
  guide: 1,
} as const

export type LastmodManifest = Record<string, { hash: string; lastmod: string }>

function sha(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}

function logoFileHash(logoUrl: string, publicDir: string): string | null {
  if (!logoUrl.startsWith("/")) return null
  const filePath = path.join(publicDir, logoUrl)
  if (!existsSync(filePath)) return null
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").slice(0, 16)
}

function entityFingerprint(entity: EntityRecord, publicDir: string) {
  const logoUrl = getEntityLogoUrl(entity)
  return {
    name: entity.name,
    domain: entity.domain,
    slug: entity.slug,
    categoryId: entity.categoryId,
    logoUrl,
    logoFile: logoFileHash(logoUrl, publicDir),
  }
}

/** Fingerprint per sitemap path (`/`, `/logo/<slug>`, …). */
export function computePageHashes(publicDir: string): Record<string, string> {
  const hashes: Record<string, string> = {}
  const entities = getAllEntities().filter((entity) => !GONE_LOGO_SLUGS.has(entity.slug))
  const fingerprints = new Map(
    entities.map((entity) => [entity.slug, entityFingerprint(entity, publicDir)]),
  )

  for (const entity of entities) {
    hashes[`/logo/${entity.slug}`] = sha({
      template: PAGE_TEMPLATE_VERSIONS.logo,
      entity: fingerprints.get(entity.slug),
      categoryName: entity.categoryName,
      title: getEntityPageTitle(entity),
      description: buildEntityMetaDescription(entity),
      related: getRelatedEntities(entity.slug, 8).map((item) => fingerprints.get(item.slug)),
    })
  }

  const categoryHashes: Record<string, string> = {}
  for (const category of categories) {
    const hash = sha({
      template: PAGE_TEMPLATE_VERSIONS.category,
      name: category.name,
      description: category.description,
      seoIntro: category.seoIntro,
      seo: getCategorySeoCopy(category),
      entities: entities
        .filter((entity) => entity.categoryId === category.id)
        .map((entity) => fingerprints.get(entity.slug)),
    })
    categoryHashes[category.id] = hash
    hashes[`/categoria/${category.id}`] = hash
  }

  hashes["/categoria/banderas"] = sha({
    template: PAGE_TEMPLATE_VERSIONS.banderas,
    category: FLAGS_CATEGORY,
    dataset: flagsDatasetVersion,
  })

  hashes["/"] = sha({
    template: PAGE_TEMPLATE_VERSIONS.home,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    categories: categoryHashes,
    flags: flagsDatasetVersion,
  })

  hashes["/categorias"] = sha({
    template: PAGE_TEMPLATE_VERSIONS.categorias,
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      count: category.entities.length,
    })),
    flags: flagsDatasetVersion,
  })

  hashes["/docs"] = sha({
    template: PAGE_TEMPLATE_VERSIONS.docs,
    categories: categories.map((category) => category.id),
  })

  for (const guide of guides) {
    hashes[`/guia/${guide.slug}`] = sha({ template: PAGE_TEMPLATE_VERSIONS.guide, guide })
  }

  return hashes
}

/** Keep the stored date when the fingerprint is unchanged; stamp `today` otherwise. */
export function reconcileLastmod(
  previous: LastmodManifest,
  hashes: Record<string, string>,
  today: string,
): LastmodManifest {
  const next: LastmodManifest = {}
  for (const pagePath of Object.keys(hashes).sort()) {
    const hash = hashes[pagePath]
    const known = previous[pagePath]
    next[pagePath] =
      known && known.hash === hash ? known : { hash, lastmod: today }
  }
  return next
}

export function stalePaths(
  manifest: LastmodManifest,
  hashes: Record<string, string>,
): string[] {
  const stale = Object.keys(hashes).filter(
    (pagePath) => manifest[pagePath]?.hash !== hashes[pagePath],
  )
  const orphaned = Object.keys(manifest).filter((pagePath) => !(pagePath in hashes))
  return [...stale, ...orphaned].sort()
}
