import type { SitemapEntry } from '@/lib/sitemap-entries.ts'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toIsoDate(value: Date | undefined): string | null {
  if (!value) return null
  if (Number.isNaN(value.getTime())) return null
  return value.toISOString()
}

export function serializeSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = toIsoDate(entry.lastModified)
      const parts = [
        '  <url>',
        `    <loc>${escapeXml(entry.url)}</loc>`,
      ]
      if (lastmod) {
        parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`)
      }
      if (entry.changeFrequency) {
        parts.push(
          `    <changefreq>${escapeXml(entry.changeFrequency)}</changefreq>`,
        )
      }
      if (entry.priority !== undefined) {
        parts.push(`    <priority>${entry.priority}</priority>`)
      }
      parts.push('  </url>')
      return parts.join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}
