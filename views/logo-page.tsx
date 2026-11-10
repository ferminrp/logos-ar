import { AppLink as Link } from '@/components/app-link'
import { BreadcrumbJsonLd } from '@/components/breadcrumb-json-ld'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { EntityDetail } from '@/components/entity-detail'
import { getEntityBySlug, getRelatedEntities } from '@/lib/entity-index'
import { isGoneLogoSlug } from '@/lib/gone-logo-slugs'

export function LogoPageView({ slug }: { slug: string }) {
  if (isGoneLogoSlug(slug)) {
    return null
  }

  const entity = getEntityBySlug(slug)
  if (!entity) {
    return null
  }

  const related = getRelatedEntities(slug, 8)

  const breadcrumbItems = [
    { name: 'Inicio', href: '/' },
    { name: entity.categoryName, href: `/categoria/${entity.categoryId}` },
    { name: entity.name, href: `/logo/${slug}` },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
        {' · '}
        <Link href="/categorias" className="text-primary hover:underline">
          Categorías
        </Link>
      </p>
    </main>
  )
}
