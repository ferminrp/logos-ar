import { categories, type Category, type Entity } from "@/lib/logos-data"

export interface EntityRecord extends Entity {
  slug: string
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
      const baseSlug = slugify(entity.name)
      const count = slugCounts.get(baseSlug) ?? 0
      slugCounts.set(baseSlug, count + 1)

      const slug = count === 0 ? baseSlug : `${baseSlug}-${entity.id}`

      if (count > 0 && process.env.NODE_ENV !== "production") {
        console.warn(
          `[entity-index] Slug collision for "${entity.name}": using "${slug}"`
        )
      }

      records.push({
        ...entity,
        slug,
        categoryId: category.id,
        categoryName: category.name,
      })
    }
  }

  return records
}

const entityIndex = buildEntityIndex()
const entityBySlug = new Map(entityIndex.map((record) => [record.slug, record]))

export function getAllEntities(): EntityRecord[] {
  return entityIndex
}

export function getAllEntitySlugs(): string[] {
  return entityIndex.map((record) => record.slug)
}

export function getEntityBySlug(slug: string): EntityRecord | null {
  return entityBySlug.get(slug) ?? null
}

export function getEntitySlug(entity: Entity): string {
  const record = entityIndex.find((item) => item.id === entity.id)
  return record?.slug ?? slugify(entity.name)
}

export function getCategoryById(id: string): Category | null {
  return categories.find((category) => category.id === id) ?? null
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
