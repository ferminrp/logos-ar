import { NextResponse } from "next/server"
import {
  categories,
  getDuckDuckGoFaviconUrl,
  getGoogleFaviconUrl,
} from "@/lib/logos-data"

type LogoItem = {
  name: string
  domain: string
  google_domain: string
  duck_domain: string
  categoryId: string
  categoryName: string
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const CACHE_CONTROL_HEADER =
  "public, max-age=0, s-maxage=31536000, stale-while-revalidate=31536000"

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed
}

function normalize(value: string | null): string {
  return value?.trim().toLowerCase() ?? ""
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = normalize(searchParams.get("q"))
  const domain = normalize(searchParams.get("domain"))
  const category = normalize(searchParams.get("category"))
  const offset = parsePositiveInt(searchParams.get("offset"), 0)
  const limit = Math.min(
    parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
    MAX_LIMIT,
  )

  const requestedCategory = category
    ? categories.find((entry) => entry.id.toLowerCase() === category)
    : null

  const sourceCategories = requestedCategory ? [requestedCategory] : categories

  const allItems: LogoItem[] = sourceCategories.flatMap((entry) =>
    entry.entities.map((entity) => ({
      name: entity.name,
      domain: entity.domain,
      google_domain: getGoogleFaviconUrl(entity.domain),
      duck_domain: getDuckDuckGoFaviconUrl(entity.domain),
      categoryId: entry.id,
      categoryName: entry.name,
    })),
  )

  const filteredItems = allItems.filter((item) => {
    if (q && !item.name.toLowerCase().includes(q) && !item.domain.toLowerCase().includes(q)) {
      return false
    }

    if (domain && !item.domain.toLowerCase().includes(domain)) {
      return false
    }

    return true
  })

  const pagedItems = filteredItems.slice(offset, offset + limit)
  const hasMore = offset + pagedItems.length < filteredItems.length

  const response = NextResponse.json({
    items: pagedItems,
    total: filteredItems.length,
    hasMore,
    filters: {
      q: q || null,
      domain: domain || null,
      category: requestedCategory?.id ?? (category || null),
      limit,
      offset,
    },
  })

  response.headers.set("Cache-Control", CACHE_CONTROL_HEADER)

  return response
}
