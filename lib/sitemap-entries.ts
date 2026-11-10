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
}

import { getAllEntitySlugs } from "./entity-index.ts"
import { GONE_LOGO_SLUGS } from "./gone-logo-slugs.ts"
import { getAllGuideSlugs } from "./guide-data.ts"
import { categories } from "./logos-data.ts"
import { getSiteUrl } from "./site-url.ts"

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, "")
}

export function getSitemapEntries(): SitemapEntry[] {
  const siteUrl = normalizeSiteUrl(getSiteUrl())
  const now = new Date()

  const staticPages: SitemapEntry[] = [
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

  const categoryPages: SitemapEntry[] = [
    ...categories.map((category) => ({
      url: `${siteUrl}/categoria/${category.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteUrl}/categoria/banderas`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  const entityPages: SitemapEntry[] = getAllEntitySlugs()
    .filter((slug) => !GONE_LOGO_SLUGS.has(slug))
    .map(
    (slug) => ({
      url: `${siteUrl}/logo/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  )

  const guidePages: SitemapEntry[] = getAllGuideSlugs().map((slug) => ({
    url: `${siteUrl}/guia/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...entityPages, ...guidePages]
}
