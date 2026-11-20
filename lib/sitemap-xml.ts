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
  // Date-only W3C format: lastmod tracks content changes per day, not build time.
  return value.toISOString().slice(0, 10)
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
      for (const image of entry.images ?? []) {
        parts.push(
          '    <image:image>',
          `      <image:loc>${escapeXml(image)}</image:loc>`,
          '    </image:image>',
        )
      }
      parts.push('  </url>')
      return parts.join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`
}
