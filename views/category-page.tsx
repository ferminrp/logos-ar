import { AppLink as Link } from '@/components/app-link'
import { BreadcrumbJsonLd } from '@/components/breadcrumb-json-ld'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { EntityPreviewCard } from '@/components/entity-preview-card'
import { ItemListJsonLd } from '@/components/item-list-json-ld'
import { getAllEntities, getCategoryById } from '@/lib/entity-index'
import { getCategorySeoCopy } from '@/lib/category-seo'

export function CategoryPageView({ slug }: { slug: string }) {
  const category = getCategoryById(slug)
  if (!category) {
    return null
  }

  const seo = getCategorySeoCopy(category)

  const breadcrumbItems = [
    { name: 'Inicio', href: '/' },
    { name: 'Categorías', href: '/categorias' },
    { name: category.name, href: `/categoria/${slug}` },
  ]

  const entities = getAllEntities().filter(
    (entity) => entity.categoryId === category.id,
  )

  const itemListEntries = entities.map((entity) => ({
    name: entity.name,
    url: `/logo/${entity.slug}`,
  }))

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ItemListJsonLd name={`Logos de ${category.name}`} items={itemListEntries} />
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
        {seo.h1}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {seo.introLead ?? category.description}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {category.entities.length} entidades
      </p>

      <section
        className="mt-6 max-w-2xl"
        aria-label={`Información sobre logos de ${category.name}`}
      >
        <p className="text-muted-foreground leading-relaxed">{category.seoIntro}</p>
      </section>

      {seo.featuredLogoLink ? (
        <section
          className="mt-8 max-w-2xl"
          aria-labelledby="category-featured-logo-heading"
        >
          <Link
            href={`/logo/${seo.featuredLogoLink.slug}`}
            className="group block rounded-2xl border-2 border-primary/30 bg-primary/5 px-5 py-4 shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/10"
          >
            <h2
              id="category-featured-logo-heading"
              className="text-lg font-semibold text-foreground group-hover:text-primary"
            >
              {seo.featuredLogoLink.heading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {seo.featuredLogoLink.description}
            </p>
            <p className="mt-3 text-sm font-medium text-primary">Ver logo BNA →</p>
          </Link>
        </section>
      ) : null}

      <section className="mt-8" aria-label={`Logos de ${category.name}`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entities.map((entity) => (
            <EntityPreviewCard key={entity.id} entity={entity} />
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        <Link href="/categorias" className="text-primary hover:underline">
          Ver todas las categorías
        </Link>
        {' · '}
        <Link href="/" className="text-primary hover:underline">
          Directorio completo
        </Link>
      </p>
    </main>
  )
}
