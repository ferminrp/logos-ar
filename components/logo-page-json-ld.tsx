import type { EntityRecord } from "@/lib/entity-index"
import { getEntityLogoUrl, resolveEntityLogoUrl } from "@/lib/entity-logo"
import { getSiteUrl } from "@/lib/site-url"

/** Self-hosted catalog logo as an absolute URL, or null for third-party favicon proxies. */
export function getHostedLogoImageUrl(entity: EntityRecord): string | null {
  const logoUrl = getEntityLogoUrl(entity)
  return logoUrl.startsWith("/") ? resolveEntityLogoUrl(logoUrl) : null
}

export function buildLogoPageSchema(entity: EntityRecord) {
  const siteUrl = getSiteUrl().replace(/\/$/, "")
  const pageUrl = `${siteUrl}/logo/${entity.slug}`
  const imageUrl = getHostedLogoImageUrl(entity)

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: `Logo ${entity.name}`,
    inLanguage: "es-AR",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: {
      "@type": "Organization",
      name: entity.name,
      url: `https://${entity.domain}`,
    },
    ...(imageUrl
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            "@id": `${pageUrl}#logo`,
            contentUrl: imageUrl,
            url: imageUrl,
            name: `Logo de ${entity.name}`,
            caption: `Logo de ${entity.name} en ${imageUrl.endsWith(".svg") ? "SVG" : "PNG"}`,
            encodingFormat: imageUrl.endsWith(".svg") ? "image/svg+xml" : "image/png",
            representativeOfPage: true,
          },
        }
      : {}),
  }
}

export function LogoPageJsonLd({ entity }: { entity: EntityRecord }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLogoPageSchema(entity)) }}
    />
  )
}
