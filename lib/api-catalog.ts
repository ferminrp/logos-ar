import { getSiteUrl } from "@/lib/site-url"

export const API_CATALOG_CONTENT_TYPE =
  'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"; charset=utf-8'

export function getApiCatalogPayload() {
  const siteUrl = getSiteUrl()

  return {
    linkset: [
      {
        anchor: `${siteUrl}/api/logos`,
        "service-desc": [
          {
            href: `${siteUrl}/api/logos`,
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: `${siteUrl}/docs`,
            type: "text/html",
          },
        ],
      },
    ],
  }
}

export function getHomeLinkHeader(): string {
  const siteUrl = getSiteUrl()

  return [
    `<${siteUrl}/.well-known/api-catalog>; rel="api-catalog"`,
    `<${siteUrl}/api/logos>; rel="item"; type="application/json"`,
  ].join(", ")
}
