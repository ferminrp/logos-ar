"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Code,
  Zap,
  Building2,
  Wallet,
  TrendingUp,
  Landmark,
  Store,
  Newspaper,
  Car,
  UtensilsCrossed,
  Fuel,
  Shield,
  Shirt,
  Bike,
  Plane,
  Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategorySection } from "@/components/category-section"
import { ConfigPanel } from "@/components/config-panel"
import { FaqSection } from "@/components/faq-section"
import { categories, type Category } from "@/lib/logos-data"

const categoryIcons: Record<string, React.ElementType> = {
  bancos: Building2,
  fintechs: Wallet,
  alycs: TrendingUp,
  "entes-estatales": Landmark,
  retail: Store,
  medios: Newspaper,
  automotrices: Car,
  alimentos: UtensilsCrossed,
  combustibles: Fuel,
  seguros: Shield,
  indumentaria: Shirt,
  delivery: Bike,
  turismo: Plane,
  energia: Lightbulb,
}

export function HomePage() {
  const searchParams = useSearchParams()
  const searchQuery = (searchParams.get("q") ?? "").trim()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)

  const filteredCategories: Category[] = categories
    .map((category) => ({
      ...category,
      entities: category.entities.filter(
        (entity) =>
          entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entity.domain.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => {
      if (activeCategory && category.id !== activeCategory) return false
      return category.entities.length > 0
    })

  const totalEntities = filteredCategories.reduce(
    (acc, cat) => acc + cat.entities.length,
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-40 -mt-6 px-4 sm:-mt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-x-auto rounded-3xl bg-white p-3 shadow-lg shadow-emerald-900/10 ring-1 ring-black/5">
            <div className="flex min-w-max items-center gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                activeCategory === null
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Todos
            </button>
            {categories.map((category) => {
              const Icon = categoryIcons[category.id]
              return (
                <button
                  key={category.id}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === category.id ? null : category.id
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  {category.name}
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                      activeCategory === category.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {category.entities.length}
                  </span>
                </button>
              )
            })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-card">
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

      <div className="border-b border-border">
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
