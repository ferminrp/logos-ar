import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { EntityDetail } from "@/components/entity-detail"
import {
  getAllEntitySlugs,
  getEntityBySlug,
  getRelatedEntities,
} from "@/lib/entity-index"

interface LogoPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllEntitySlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: LogoPageProps): Promise<Metadata> {
  const { slug } = await params
  const entity = getEntityBySlug(slug)

  if (!entity) {
    return { title: "Logo no encontrado" }
  }

  const title = `Logo ${entity.name} PNG y SVG transparente | Loguitos`
  const description = `Descargar logo de ${entity.name} en PNG y SVG transparente. Logo oficial para uso en presentaciones, web y diseño. Dominio: ${entity.domain}.`

  return {
    title,
    description,
    alternates: {
      canonical: `/logo/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/logo/${slug}`,
      type: "website",
      locale: "es_AR",
    },
  }
}

export default async function LogoPage({ params }: LogoPageProps) {
  const { slug } = await params
  const entity = getEntityBySlug(slug)

  if (!entity) {
    notFound()
  }

  const related = getRelatedEntities(slug, 8)

  const breadcrumbItems = [
    { name: "Inicio", href: "/" },
    { name: entity.categoryName, href: `/categoria/${entity.categoryId}` },
    { name: entity.name, href: `/logo/${slug}` },
  ]

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Breadcrumbs items={breadcrumbItems} />
      <EntityDetail entity={entity} related={related} slug={slug} />

      <p className="mt-10 text-sm text-muted-foreground">
        <Link
          href={`/categoria/${entity.categoryId}`}
          className="text-primary hover:underline"
        >
          Ver todos los logos de {entity.categoryName}
        </Link>
        {" · "}
        <Link href="/categorias" className="text-primary hover:underline">
          Categorías
        </Link>
      </p>
    </main>
  )
}
