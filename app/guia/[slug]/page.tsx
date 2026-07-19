import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CopyButton } from "@/components/copy-button"
import { getAllGuideSlugs, getGuideBySlug } from "@/lib/guide-data"

interface GuidePageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuideBySlug(slug)

  if (!guide) {
    return { title: "Guía no encontrada" }
  }

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: `/guia/${slug}`,
    },
    openGraph: {
      title: `${guide.title} | Logos Argentina`,
      description: guide.description,
      url: `/guia/${slug}`,
      type: "article",
      locale: "es_AR",
    },
  }
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)

  if (!guide) {
    notFound()
  }

  const breadcrumbItems = [
    { name: "Inicio", href: "/" },
    { name: guide.title, href: `/guia/${slug}` },
  ]

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
        {guide.title}
      </h1>
      <p className="mt-3 text-muted-foreground">{guide.description}</p>

      <div className="mt-10 space-y-10">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">
              {section.heading}
            </h2>
            <div className="mt-3 space-y-3 text-muted-foreground">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
            {section.code && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border/80 bg-card p-4">
                <pre className="flex-1 overflow-x-auto font-mono text-xs text-foreground">
                  {section.code}
                </pre>
                <CopyButton
                  value={section.code}
                  label={`Copiar ejemplo`}
                  variant="outline"
                />
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border/80 bg-accent/60 p-5 text-sm text-muted-foreground">
        <p>
          Explorá el{" "}
          <Link href="/" className="text-primary hover:underline">
            directorio de logos
          </Link>
          , las{" "}
          <Link href="/categorias" className="text-primary hover:underline">
            categorías
          </Link>{" "}
          o la{" "}
          <Link href="/docs" className="text-primary hover:underline">
            documentación de la API
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
