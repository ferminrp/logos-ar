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

  const title = `Logos de ${category.name} en Argentina (PNG, SVG) | ${category.seoTopEntities[0]}`
  const description = `${category.seoIntro} ${category.entities.length} entidades con URLs y curls de favicon (Google y DuckDuckGo).`

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

      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
        Logos de {category.name} en Argentina
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {category.entities.length} entidades
      </p>

      <section
        className="mt-6 max-w-2xl"
        aria-label={`Información sobre logos de ${category.name}`}
      >
        <p className="text-muted-foreground leading-relaxed">{category.seoIntro}</p>
      </section>

      <ul className="mt-6 max-w-2xl columns-1 gap-x-8 text-sm sm:columns-2">
        {entities.map((entity) => (
          <li key={entity.id} className="mb-1 break-inside-avoid">
            <Link
              href={`/logo/${entity.slug}`}
              className="text-primary hover:underline"
            >
              Logo {entity.name} PNG
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 max-w-2xl" aria-labelledby="category-faq-heading">
        <h2
          id="category-faq-heading"
          className="text-lg font-semibold text-foreground"
        >
          Preguntas frecuentes
        </h2>
        <div className="mt-4 space-y-2">
          <details className="rounded-2xl border border-border/80 bg-card px-4 py-3">
            <summary className="cursor-pointer font-medium text-foreground">
              ¿Cómo descargar los logos?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Entrá a la página de cada entidad desde el listado o las tarjetas de
              abajo. Ahí vas a encontrar la URL del favicon y el comando curl listo
              para copiar (Google y DuckDuckGo). Podés usar la URL directamente en
              diseño, presentaciones o hojas de cálculo.
            </p>
          </details>
          <details className="rounded-2xl border border-border/80 bg-card px-4 py-3">
            <summary className="cursor-pointer font-medium text-foreground">
              ¿Son logos oficiales?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Mostramos favicons tal como los exponen Google y DuckDuckGo a partir
              del dominio público de cada entidad. No somos fuente oficial de
              marca; para uso corporativo o compliance conviene pedir los activos
              al área legal o marketing de cada empresa.
            </p>
          </details>
          <details className="rounded-2xl border border-border/80 bg-card px-4 py-3">
            <summary className="cursor-pointer font-medium text-foreground">
              ¿Qué formatos están disponibles?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Google devuelve PNG en distintos tamaños según el parámetro sz.
              DuckDuckGo entrega ICO en una ruta fija por dominio. En cada página
              de logo indicamos ambas opciones para que elijas la que mejor se
              adapte a tu proyecto.
            </p>
          </details>
        </div>
      </section>

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
