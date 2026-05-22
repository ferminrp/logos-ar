import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getSitemapEntries } from "../lib/sitemap-entries.ts"

type SitemapEntry = {
  url: string
  lastModified?: string | Date
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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function toIsoDate(value: string | Date | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function serializeSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = toIsoDate(entry.lastModified)
      const parts = [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        entry.changeFrequency
          ? `    <changefreq>${entry.changeFrequency}</changefreq>`
          : null,
        entry.priority !== undefined
          ? `    <priority>${entry.priority}</priority>`
          : null,
        "  </url>",
      ]
      return parts.filter(Boolean).join("\n")
    })
    .join("\n")

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n")
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outputPath = path.resolve(__dirname, "../public/sitemap.xml")

async function main() {
  const entries = getSitemapEntries()
  const xml = serializeSitemapXml(entries)
  await writeFile(outputPath, xml, "utf8")
  console.log(`Generated sitemap (${entries.length} URLs) at public/sitemap.xml`)
}

main().catch((error) => {
  console.error("Failed to generate sitemap:", error)
  process.exitCode = 1
})
