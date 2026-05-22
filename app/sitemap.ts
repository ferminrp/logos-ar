import type { MetadataRoute } from "next"
import { getSitemapEntries } from "@/lib/sitemap-entries"

export const dynamic = "force-static"
export const revalidate = false

export default function sitemap(): MetadataRoute.Sitemap {
  return getSitemapEntries()
}
