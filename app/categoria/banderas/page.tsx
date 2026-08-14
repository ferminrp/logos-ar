import type { Metadata } from "next"
import Link from "next/link"
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { FlagCard } from "@/components/flag-card"
import { FLAGS_CATEGORY, flags, flagsTotalCount } from "@/lib/flags-data"
import { FLAG_SOURCE_PAGES_URL, FLAG_SOURCE_URL } from "@/lib/flag-urls"

export const metadata: Metadata = {
  title: `Banderas de países y regiones (SVG 3:2) | ${FLAGS_CATEGORY.seoTopEntities[0]}`,
  description: `${FLAGS_CATEGORY.seoIntro} ${flagsTotalCount} banderas con URL SVG lista para copiar.`,
  alternates: {
    canonical: "/categoria/banderas",
  },
  openGraph: {
    title: "Banderas de países y regiones en SVG",
    description: FLAGS_CATEGORY.seoIntro,
    url: "/categoria/banderas",
    type: "website",
    locale: "es_AR",
  },
}

const breadcrumbItems = [
  { name: "Inicio", href: "/" },
  { name: "Categorías", href: "/categorias" },
  { name: FLAGS_CATEGORY.name, href: "/categoria/banderas" },
]

export default function BanderasCategoryPage() {
  const itemListEntries = flags.map((flag) => ({
    name: flag.name,
    url: `/categoria/banderas#${flag.code}`,
  }))

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
        Banderas de países y regiones
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {FLAGS_CATEGORY.description}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {flagsTotalCount} banderas
      </p>

      <section
        className="mt-6 max-w-2xl"
        aria-label="Información sobre banderas"
      >
        <p className="text-muted-foreground leading-relaxed">
          {FLAGS_CATEGORY.seoIntro}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Fuente:{" "}
          <a
            href={FLAG_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            country-flag-icons
          </a>
          {" "}
          (MIT) — SVGs en{" "}
          <a
            href={FLAG_SOURCE_PAGES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitLab Pages
          </a>
          .
        </p>
      </section>

      <section className="mt-8" aria-label="Banderas">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {flags.map((flag) => (
            <div key={flag.code} id={flag.code} className="min-w-0">
              <FlagCard flag={flag} />
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        <Link href="/categorias" className="text-primary hover:underline">
          Ver todas las categorías
        </Link>
        {" · "}
        <Link href="/" className="text-primary hover:underline">
          Directorio completo
        </Link>
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Banderas de países y regiones",
            numberOfItems: flagsTotalCount,
            itemListElement: itemListEntries.map((entry, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: entry.name,
              url: entry.url,
            })),
          }),
        }}
      />
    </main>
  )
}
