import { getSiteUrl } from './site-url.ts'

/** HTTP `Link` header on `/` for API discovery (matches former next.config.mjs). */
export function buildHomeLinkHeader(siteUrl?: string): string {
  const base = (siteUrl ?? getSiteUrl()).replace(/\/$/, '')
  return [
    `<${base}/.well-known/api-catalog>; rel="api-catalog"`,
    `<${base}/api/logos>; rel="item"; type="application/json"`,
  ].join(', ')
}
