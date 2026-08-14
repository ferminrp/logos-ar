import { NextResponse } from "next/server"
import logosDataset from "@/data/logos-dataset.json"
import flagsDataset from "@/data/flags-dataset.json"

type LogoItem = {
  name: string
  domain: string
  google_domain: string
  duck_domain: string
  categoryId: string
  categoryName: string
}

type FlagItem = {
  code: string
  name: string
  svgUrl: string
  categoryId: string
  categoryName: string
}

type CatalogItem = LogoItem | FlagItem

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const CACHE_CONTROL_FILTERED =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800"
const CACHE_CONTROL_UNFILTERED =
  "public, max-age=0, s-maxage=31536000, stale-while-revalidate=31536000"
const KNOWN_CATEGORIES = new Set([
  ...logosDataset.items.map((item) => item.categoryId.toLowerCase()),
  "banderas",
])

function isFlagItem(item: CatalogItem): item is FlagItem {
  return "code" in item
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed
}

function normalize(value: string | null): string {
  return value?.trim().toLowerCase() ?? ""
}

function matchesQuery(item: CatalogItem, q: string): boolean {
  if (!q) return true

  if (isFlagItem(item)) {
    return (
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    )
  }

  return (
    item.name.toLowerCase().includes(q) ||
    item.domain.toLowerCase().includes(q)
  )
}

function matchesDomain(item: CatalogItem, domain: string): boolean {
  if (!domain) return true

  if (isFlagItem(item)) {
    return item.code.toLowerCase().includes(domain)
  }

  return item.domain.toLowerCase().includes(domain)
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

  const hasKnownCategory = category ? KNOWN_CATEGORIES.has(category) : false
  const includeLogos = !hasKnownCategory || category !== "banderas"
  const includeFlags = !hasKnownCategory || category === "banderas"

  const allItems: CatalogItem[] = [
    ...(includeLogos ? logosDataset.items : []),
    ...(includeFlags ? flagsDataset.items : []),
  ]

  const filteredItems = allItems.filter((item) => {
    if (hasKnownCategory && item.categoryId.toLowerCase() !== category) {
      return false
    }

    if (!matchesQuery(item, q)) {
      return false
    }

    if (!matchesDomain(item, domain)) {
      return false
    }

    return true
  })

  const pagedItems = filteredItems.slice(offset, offset + limit)
  const hasMore = offset + pagedItems.length < filteredItems.length

  const datasetVersion = `${logosDataset.version}:${flagsDataset.version}`

  const response = NextResponse.json({
    items: pagedItems,
    total: filteredItems.length,
    hasMore,
    datasetVersion,
    filters: {
      q: q || null,
      domain: domain || null,
      category: hasKnownCategory ? category : (category || null),
      limit,
      offset,
    },
  })

  const hasSearchFilters = Boolean(q || domain || (category && hasKnownCategory))

  response.headers.set(
    "Cache-Control",
    hasSearchFilters ? CACHE_CONTROL_FILTERED : CACHE_CONTROL_UNFILTERED,
  )
  response.headers.set("X-Logos-Dataset-Version", datasetVersion)

  return response
}
