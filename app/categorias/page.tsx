import type { Metadata } from "next"
import Link from "next/link"
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CategoryHubCard } from "@/components/category-hub-card"
import { categories } from "@/lib/logos-data"

export const metadata: Metadata = {
  title: "Categorías de logos en Argentina",
  description:
    "Explorá logos y favicons por rubro: bancos, fintechs, ALyCs, retail, medios y más. URLs listas para copiar en tu web o spreadsheet.",
  alternates: {
    canonical: "/categorias",
  },
  openGraph: {
    title: "Categorías de logos en Argentina",
    description:
      "Explorá logos y favicons por rubro: bancos, fintechs, ALyCs, retail, medios y más.",
    url: "/categorias",
    type: "website",
    locale: "es_AR",
  },
}

const breadcrumbItems = [
  { name: "Inicio", href: "/" },
  { name: "Categorías", href: "/categorias" },
]

export default function CategoriasPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Categorías de logos en Argentina
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Directorio de favicons organizado por rubro. Elegí una categoría para ver
        entidades, dominios y URLs de Google o DuckDuckGo listas para copiar en tu
        app, sitio o hoja de cálculo.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryHubCard key={category.id} category={category} />
        ))}
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        ¿Buscás una entidad puntual?{" "}
        <Link href="/" className="text-primary hover:underline">
          Volvé al directorio completo
        </Link>{" "}
        o consultá la{" "}
        <Link href="/docs" className="text-primary hover:underline">
          documentación de la API
        </Link>
        .
      </p>
    </main>
  )
}
