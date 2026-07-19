import Link from "next/link"
import { EntityPreviewCard } from "./entity-preview-card"
import { getEntitySlug } from "@/lib/entity-index"
import type { EntityRecord } from "@/lib/entity-index"
import type { Category, Entity } from "@/lib/logos-data"

interface CategorySectionProps {
  category: Category
}

function toEntityRecord(entity: Entity, category: Category): EntityRecord {
  return {
    ...entity,
    slug: getEntitySlug(entity),
    categoryId: category.id,
    categoryName: category.name,
  }
}

export function CategorySection({ category }: CategorySectionProps) {
  return (
    <section id={category.id} className="scroll-mt-20">
      <h2 className="font-serif mb-4 text-xl font-medium tracking-tight text-foreground">
        <Link
          href={`/categoria/${category.id}`}
          className="hover:text-primary"
        >
          {category.name}
        </Link>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {category.entities.map((entity) => (
          <EntityPreviewCard
            key={entity.id}
            entity={toEntityRecord(entity, category)}
          />
        ))}
      </div>
    </section>
  )
}
