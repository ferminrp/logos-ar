import { getSiteUrl } from "@/lib/site-url"

const ROBOTS_BODY = `User-Agent: *
Allow: /
Content-Signal: search=yes, ai-train=no, ai-input=yes

Sitemap: ${getSiteUrl()}/sitemap.xml
`

export function GET() {
  return new Response(ROBOTS_BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  })
}
