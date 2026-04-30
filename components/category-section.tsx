"use client"

import { LogoCard } from "./logo-card"
import type { Category } from "@/lib/logos-data"

interface CategorySectionProps {
  category: Category
}

export function CategorySection({ category }: CategorySectionProps) {
  return (
    <section id={category.id} className="scroll-mt-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
        <p className="text-muted-foreground">{category.description}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {category.entities.length} entidades
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {category.entities.map((entity) => (
          <LogoCard key={entity.id} entity={entity} />
        ))}
      </div>
    </section>
  )
}
