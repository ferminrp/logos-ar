import { getSiteUrl } from "@/lib/site-url"

export interface ItemListEntry {
  name: string
  url: string
}

interface ItemListJsonLdProps {
  name: string
  items: ItemListEntry[]
}

export function ItemListJsonLd({ name, items }: ItemListJsonLdProps) {
  const siteUrl = getSiteUrl()

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
