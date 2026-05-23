import type { MetadataRoute } from "next"
import { getAllEntitySlugs } from "./entity-index.ts"
import { getAllGuideSlugs } from "./guide-data.ts"
import { categories } from "./logos-data.ts"
import { getSiteUrl } from "./site-url.ts"

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, "")
}

export function getSitemapEntries(): MetadataRoute.Sitemap {
  const siteUrl = normalizeSiteUrl(getSiteUrl())
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/categorias`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/docs`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/categoria/${category.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const entityPages: MetadataRoute.Sitemap = getAllEntitySlugs().map(
    (slug) => ({
      url: `${siteUrl}/logo/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  )

  const guidePages: MetadataRoute.Sitemap = getAllGuideSlugs().map((slug) => ({
    url: `${siteUrl}/guia/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...entityPages, ...guidePages]
}
