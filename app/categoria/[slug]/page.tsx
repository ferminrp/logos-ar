import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { EntityPreviewCard } from "@/components/entity-preview-card"
import { ItemListJsonLd } from "@/components/item-list-json-ld"
import { getAllEntities, getCategoryById } from "@/lib/entity-index"
import { categories } from "@/lib/logos-data"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.id }))
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryById(slug)

  if (!category) {
    return { title: "Categoría no encontrada" }
  }

  const title = `Logos de ${category.name} en Argentina`
  const description = `${category.description}. ${category.entities.length} entidades con URLs y curls de favicon (Google y DuckDuckGo).`

  return {
    title,
    description,
    alternates: {
      canonical: `/categoria/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/categoria/${slug}`,
      type: "website",
      locale: "es_AR",
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategoryById(slug)

  if (!category) {
    notFound()
  }

  const breadcrumbItems = [
    { name: "Inicio", href: "/" },
    { name: "Categorías", href: "/categorias" },
    { name: category.name, href: `/categoria/${slug}` },
  ]

  const entities = getAllEntities().filter(
    (entity) => entity.categoryId === category.id
  )

  const itemListEntries = entities.map((entity) => ({
    name: entity.name,
    url: `/logo/${entity.slug}`,
  }))

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ItemListJsonLd
        name={`Logos de ${category.name}`}
        items={itemListEntries}
      />
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Logos de {category.name} en Argentina
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {category.entities.length} entidades
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {entities.map((entity) => (
          <EntityPreviewCard key={entity.id} entity={entity} />
        ))}
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        <Link href="/categorias" className="text-primary hover:underline">
          Ver todas las categorías
        </Link>
        {" · "}
        <Link href="/" className="text-primary hover:underline">
          Directorio completo
        </Link>
      </p>
    </main>
  )
}
