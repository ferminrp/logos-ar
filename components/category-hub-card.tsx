import Link from "next/link"
import { getCategoryIcon } from "@/lib/category-icons"
import type { Category } from "@/lib/logos-data"

interface CategoryHubCardProps {
  category: Category
}

export function CategoryHubCard({ category }: CategoryHubCardProps) {
  const Icon = getCategoryIcon(category.id)

  return (
    <Link
      href={`/categoria/${category.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-sm"
    >
      <div className="mb-3 flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-foreground group-hover:text-primary">
          {category.name}
        </h2>
      </div>
      <p className="mb-3 flex-1 text-sm text-muted-foreground">
        {category.description}
      </p>
      <p className="text-xs font-medium text-muted-foreground">
        {category.entities.length} entidades
      </p>
    </Link>
  )
}
