"use client"

import { useState } from "react"
import { Search, Code, Zap, Building2, Wallet, TrendingUp, Landmark } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CategorySection } from "@/components/category-section"
import { ConfigPanel } from "@/components/config-panel"
import { ConfigProvider } from "@/lib/config-context"
import { categories, type Category } from "@/lib/logos-data"

const categoryIcons: Record<string, React.ElementType> = {
  bancos: Building2,
  fintechs: Wallet,
  alycs: TrendingUp,
  "entes-estatales": Landmark,
}

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("")
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                Logos Argentina
              </h1>
              <p className="text-sm text-muted-foreground">
                {"¿Sabías que hay APIs gratuitas de logos?"}
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o dominio..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {category.name}
                  <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.5 text-xs">
                    {category.entities.length}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Info banner */}
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

      {/* Config Panel */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Parámetros de endpoints</p>
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

      {/* Main content */}
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

      {/* Footer */}
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

export default function Home() {
  return (
    <ConfigProvider>
      <HomeContent />
    </ConfigProvider>
  )
}
