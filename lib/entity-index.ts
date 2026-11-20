import isotiposMetadata from "../data/isotipos/metadata.json" with { type: "json" }
import { categories, type Category, type Entity } from "./logos-data.ts"
import { getEntityLogoUrl } from "./entity-logo.ts"

export interface EntityRecord extends Entity {
  slug: string
  slugAliases?: string[]
  seoAliases?: string[]
  categoryId: string
  categoryName: string
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildEntityIndex(): EntityRecord[] {
  const slugCounts = new Map<string, number>()
  const records: EntityRecord[] = []

  for (const category of categories) {
    for (const entity of category.entities) {
      let slug: string

      if (entity.slug) {
        const requested = entity.slug
        const taken = slugCounts.get(requested) ?? 0
        slugCounts.set(requested, taken + 1)
        slug = taken > 0 ? `${requested}-${entity.id}` : requested
        if (slug !== requested) {
          slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1)
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[entity-index] Duplicate explicit slug "${requested}" for "${entity.name}": using "${slug}"`
            )
          }
        }
      } else {
        const baseSlug = slugify(entity.name)
        const count = slugCounts.get(baseSlug) ?? 0
        slugCounts.set(baseSlug, count + 1)
        slug = count === 0 ? baseSlug : `${baseSlug}-${entity.id}`

        if (slug !== baseSlug) {
          slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1)
        }

        if (count > 0 && process.env.NODE_ENV !== "production") {
          console.warn(
            `[entity-index] Slug collision for "${entity.name}": using "${slug}"`
          )
        }
      }

      records.push({
        ...entity,
        slug,
        slugAliases: entity.slugAliases,
        seoAliases: entity.seoAliases,
        categoryId: category.id,
        categoryName: category.name,
      })
    }
  }

  return records
}

const entityIndex = buildEntityIndex()
const entityBySlug = new Map(entityIndex.map((record) => [record.slug, record]))
const entityBySlugAlias = new Map<string, EntityRecord>()
for (const record of entityIndex) {
  for (const alias of record.slugAliases ?? []) {
    if (alias !== record.slug && !entityBySlugAlias.has(alias)) {
      entityBySlugAlias.set(alias, record)
    }
  }
}

export function getAllEntities(): EntityRecord[] {
  return entityIndex
}

export function getAllEntitySlugs(): string[] {
  return entityIndex.map((record) => record.slug)
}

export function getEntityBySlug(slug: string): EntityRecord | null {
  return entityBySlug.get(slug) ?? entityBySlugAlias.get(slug) ?? null
}

export function getEntitySlug(entity: Entity): string {
  const record = entityIndex.find((item) => item.id === entity.id)
  return record?.slug ?? slugify(entity.name)
}

export function getCategoryById(id: string): Category | null {
  return categories.find((category) => category.id === id) ?? null
}

const isotipoSlugSet = new Set(
  (isotiposMetadata as { slug: string }[]).map((row) => row.slug),
)

function hostedLogoBasename(logoUrl: string): string | null {
  const match = /^\/logos\/([^/]+)\.(png|svg)$/.exec(logoUrl)
  return match?.[1] ?? null
}

export function getEntitySlugRedirects(): {
  source: string
  destination: string
  permanent: true
}[] {
  const redirects: {
    source: string
    destination: string
    permanent: true
  }[] = []

  for (const record of entityIndex) {
    const logoUrl = getEntityLogoUrl(record)
    const hostedBase =
      logoUrl.startsWith("/") ? hostedLogoBasename(logoUrl) : null

    for (const alias of record.slugAliases ?? []) {
      if (alias === record.slug) continue
      redirects.push({
        source: `/logo/${alias}`,
        destination: `/logo/${record.slug}`,
        permanent: true,
      })

      if (hostedBase) {
        for (const ext of ["png", "svg"] as const) {
          redirects.push({
            source: `/logos/${alias}.${ext}`,
            destination: `/logos/${hostedBase}.${ext}`,
            permanent: true,
          })
        }
      }

      if (isotipoSlugSet.has(record.slug)) {
        redirects.push({
          source: `/logos/${alias}/isotipo.svg`,
          destination: `/logos/${record.slug}/isotipo.svg`,
          permanent: true,
        })
      }
    }
  }

  return redirects
}

export function getRelatedEntities(slug: string, limit = 8): EntityRecord[] {
  const entity = getEntityBySlug(slug)
  if (!entity) return []

  return entityIndex
    .filter(
      (record) =>
        record.categoryId === entity.categoryId && record.slug !== slug
    )
    .slice(0, limit)
}
