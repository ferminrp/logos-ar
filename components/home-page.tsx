"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CategorySection } from "@/components/category-section"
import { FaqSection } from "@/components/faq-section"
import { SiteFooter } from "@/components/site-footer"
import { categories, type Category } from "@/lib/logos-data"
import { cn } from "@/lib/utils"

function categoryChipClassName() {
  return cn(
    "rounded-xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
    "hover:bg-muted hover:text-foreground"
  )
}

export function HomePage() {
  const searchParams = useSearchParams()
  const searchQuery = (searchParams.get("q") ?? "").trim()
  const filteredCategories: Category[] = categories
    .map((category) => ({
      ...category,
      entities: category.entities.filter(
        (entity) =>
          entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entity.domain.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.entities.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {searchQuery ? (
          <p className="mb-6 text-sm text-muted-foreground">
            Resultados para &quot;{searchQuery}&quot;
          </p>
        ) : null}

        <nav
          aria-label="Categorías"
          className="mb-8 flex flex-wrap items-center gap-2 lg:hidden"
        >
          <span
            className={cn(
              "rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
            )}
          >
            Todos
          </span>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categoria/${category.id}`}
              className={categoryChipClassName()}
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <div className="space-y-10">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                No se encontraron resultados para &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          <Link href="/categorias" className="text-primary hover:underline">
            Ver todas las categorías
          </Link>
          {" · "}
          <Link href="/docs" className="text-primary hover:underline">
            Documentación API
          </Link>
        </p>
      </main>

      <FaqSection limit={3} />

      <SiteFooter />
    </div>
  )
}
