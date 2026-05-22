"use client"

import Link from "next/link"
import { LogoCard } from "./logo-card"
import type { Category } from "@/lib/logos-data"

interface CategorySectionProps {
  category: Category
}

export function CategorySection({ category }: CategorySectionProps) {
  return (
    <section id={category.id} className="scroll-mt-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          <Link
            href={`/categoria/${category.id}`}
            className="hover:text-primary"
          >
            {category.name}
          </Link>
        </h2>
        <p className="text-muted-foreground">{category.description}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {category.entities.length} entidades ·{" "}
          <Link
            href={`/categoria/${category.id}`}
            className="text-primary hover:underline"
          >
            Ver categoría
          </Link>
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
