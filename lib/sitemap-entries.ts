export type SitemapEntry = {
  url: string
  lastModified?: Date
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never"
  priority?: number
  /** Absolute URLs of images that belong to this page (image sitemap extension). */
  images?: string[]
}

import lastmodManifest from "../data/sitemap-lastmod.json" with { type: "json" }
import { getAllEntities } from "./entity-index.ts"
import { getEntityLogoUrl } from "./entity-logo.ts"
import { GONE_LOGO_SLUGS } from "./gone-logo-slugs.ts"
import { getAllGuideSlugs } from "./guide-data.ts"
import { categories } from "./logos-data.ts"
import { getSiteUrl } from "./site-url.ts"

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, "")
}

const lastmodByPath = lastmodManifest as Record<
  string,
  { hash: string; lastmod: string } | undefined
>

/** Date the page content last changed (see lib/sitemap-lastmod.ts); undefined if unknown. */
function lastModifiedFor(pagePath: string): Date | undefined {
  const lastmod = lastmodByPath[pagePath]?.lastmod
  if (!lastmod) return undefined
  const date = new Date(`${lastmod}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function getSitemapEntries(): SitemapEntry[] {
  const siteUrl = normalizeSiteUrl(getSiteUrl())

  const staticPages: SitemapEntry[] = [
    {
      url: `${siteUrl}/`,
      lastModified: lastModifiedFor("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/categorias`,
      lastModified: lastModifiedFor("/categorias"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/docs`,
      lastModified: lastModifiedFor("/docs"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]

  const categoryPages: SitemapEntry[] = [
    ...categories.map((category) => ({
      url: `${siteUrl}/categoria/${category.id}`,
      lastModified: lastModifiedFor(`/categoria/${category.id}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteUrl}/categoria/banderas`,
      lastModified: lastModifiedFor("/categoria/banderas"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  const entityPages: SitemapEntry[] = getAllEntities()
    .filter((entity) => !GONE_LOGO_SLUGS.has(entity.slug))
    .map((entity) => {
      const logoUrl = getEntityLogoUrl(entity)
      return {
        url: `${siteUrl}/logo/${entity.slug}`,
        lastModified: lastModifiedFor(`/logo/${entity.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        // Only logos we host: third-party favicon proxies are not ours to submit.
        ...(logoUrl.startsWith("/") ? { images: [`${siteUrl}${logoUrl}`] } : {}),
      }
    })

  const guidePages: SitemapEntry[] = getAllGuideSlugs().map((slug) => ({
    url: `${siteUrl}/guia/${slug}`,
    lastModified: lastModifiedFor(`/guia/${slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...entityPages, ...guidePages]
}
