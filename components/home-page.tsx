"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Code, Zap, ChevronDown } from "lucide-react"
import { categoryIcons } from "@/lib/category-icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategorySection } from "@/components/category-section"
import { ConfigPanel } from "@/components/config-panel"
import { FaqSection } from "@/components/faq-section"
import { categories, type Category } from "@/lib/logos-data"
import { cn } from "@/lib/utils"

const primaryCategoryIds = [
  "bancos",
  "fintechs",
  "alycs",
  "entes-estatales",
  "retail",
  "medios",
  "automotrices",
] as const

const overflowCategoryIds = [
  "alimentos",
  "combustibles",
  "seguros",
  "indumentaria",
  "gastronomia",
  "turismo",
  "energia",
  "indie-projects",
] as const

const primaryCategorySet = new Set<string>(primaryCategoryIds)
const overflowCategorySet = new Set<string>(overflowCategoryIds)

function categoryButtonClassName(isActive: boolean) {
  return cn(
    "inline-flex items-center gap-2 rounded-full text-sm font-medium transition-colors",
    isActive
      ? "bg-[#118652] px-4 py-2 text-white shadow-[0_8px_20px_rgba(17,134,82,0.22)]"
      : "px-2 py-2 text-slate-600 hover:text-slate-900"
  )
}

export function HomePage() {
  const searchParams = useSearchParams()
  const searchQuery = (searchParams.get("q") ?? "").trim()
  const [showConfig, setShowConfig] = useState(false)
  const primaryCategories = categories.filter((category) =>
    primaryCategorySet.has(category.id)
  )
  const overflowCategories = categories.filter((category) =>
    overflowCategorySet.has(category.id)
  )
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

  const totalEntities = filteredCategories.reduce(
    (acc, cat) => acc + cat.entities.length,
    0
  )
  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-20 -mt-5 px-4 sm:-mt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[1.8rem] bg-white/96 p-2.5 shadow-[0_16px_48px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 backdrop-blur">
            <div className="hidden items-center justify-between gap-1 lg:flex">
              <Link href="/" className={categoryButtonClassName(true)}>
                Todos
              </Link>

              {primaryCategories.map((category, index) => {
                const Icon = categoryIcons[category.id]

                return (
                  <div key={category.id} className="flex items-center">
                    {index > 0 && (
                      <div className="mx-1 h-6 w-px bg-slate-200" aria-hidden="true" />
                    )}
                    <Link
                      href={`/categoria/${category.id}`}
                      className={categoryButtonClassName(false)}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                      <span>{category.name}</span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs leading-none text-slate-500">
                        {category.entities.length}
                      </span>
                    </Link>
                  </div>
                )
              })}

              <div className="mx-1 h-6 w-px bg-slate-200" aria-hidden="true" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={categoryButtonClassName(false)}
                    aria-label="Más categorías"
                  >
                    <span>Más</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 rounded-2xl border-slate-200 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
                >
                  {overflowCategories.map((category) => {
                    const Icon = categoryIcons[category.id]

                    return (
                      <DropdownMenuItem key={category.id} asChild>
                        <Link
                          href={`/categoria/${category.id}`}
                          className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-slate-700 focus:bg-slate-100"
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          <span>{category.name}</span>
                          <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                            {category.entities.length}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="overflow-x-auto lg:hidden">
              <div className="flex min-w-max items-center gap-2 pr-1">
                <Link href="/" className={categoryButtonClassName(true)}>
                  Todos
                </Link>
                {categories.map((category) => {
                  const Icon = categoryIcons[category.id]

                  return (
                    <Link
                      key={category.id}
                      href={`/categoria/${category.id}`}
                      className={categoryButtonClassName(false)}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                      <span>{category.name}</span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs leading-none text-slate-500">
                        {category.entities.length}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden border-b border-border bg-card sm:block">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Code className="h-4 w-4 text-primary" />
              <span>APIs gratuitas de Google y DuckDuckGo</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span>Sin API key, sin registro</span>
            </div>
            <div className="ml-auto text-muted-foreground">
              {totalEntities} logos disponibles
            </div>
          </div>
        </div>
      </div>

      <div className="hidden border-b border-border sm:block">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Parámetros de endpoints
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfig((prev) => !prev)}
            >
              {showConfig ? "Ocultar configuración" : "Mostrar configuración"}
            </Button>
          </div>
          {showConfig && (
            <div className="mt-4">
              <ConfigPanel />
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-12">
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

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/categorias" className="text-primary hover:underline">
            Ver todas las categorías
          </Link>
        </p>
      </main>

      <FaqSection />

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="mb-2 font-medium text-foreground">
                Cómo usar los endpoints
              </h3>
              <div className="space-y-2 font-mono text-xs">
                <p className="rounded bg-secondary p-2">
                  <span className="text-primary">Google:</span>{" "}
                  {`https://s2.googleusercontent.com/s2/favicons?domain={DOMINIO}&sz={SIZE}`}
                </p>
                <p className="rounded bg-secondary p-2">
                  <span className="text-primary">DuckDuckGo:</span>{" "}
                  {`https://icons.duckduckgo.com/ip3/{DOMINIO}.ico`}
                </p>
              </div>
            </div>
            <p>
              Datos recopilados de entidades financieras argentinas reguladas.
              Los logos son propiedad de sus respectivas empresas.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
