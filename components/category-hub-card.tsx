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
      className="group flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(40,35,30,0.03)] transition-all hover:border-border hover:shadow-[0_4px_16px_rgba(40,35,30,0.06)]"
    >
      <div className="mb-3 flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <h2 className="font-serif text-lg font-medium tracking-tight text-foreground group-hover:text-primary">
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
