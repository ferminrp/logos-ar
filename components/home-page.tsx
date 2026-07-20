"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { CategorySection } from "@/components/category-section"
import { FaqSection } from "@/components/faq-section"
import { SiteFooter } from "@/components/site-footer"
import { Input } from "@/components/ui/input"
import { categories, type Category } from "@/lib/logos-data"
import { cn } from "@/lib/utils"

function categoryChipClassName() {
  return cn(
    "rounded-xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
    "hover:bg-muted hover:text-foreground"
  )
}

export function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchQuery = (searchParams.get("q") ?? "").trim()
  const [searchValue, setSearchValue] = useState(searchQuery)
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

  useEffect(() => {
    setSearchValue(searchQuery)
  }, [searchQuery])

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const query = searchValue.trim()
    const nextParams = new URLSearchParams()

    if (query) {
      nextParams.set("q", query)
    }

    const nextUrl = nextParams.size > 0 ? `/?${nextParams.toString()}` : "/"

    if (pathname === "/" && searchQuery === query) {
      return
    }

    router.push(nextUrl)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSearchSubmit}
          className="relative mb-6 w-full lg:hidden"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o dominio..."
            className="h-12 rounded-2xl border border-border bg-white pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground shadow-none focus-visible:border-ring/50 focus-visible:ring-2 focus-visible:ring-ring/25 md:text-sm"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </form>

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
