import { NextResponse } from "next/server"
import {
  API_CATALOG_CONTENT_TYPE,
  getApiCatalogPayload,
} from "@/lib/api-catalog"

export function GET() {
  return NextResponse.json(getApiCatalogPayload(), {
    headers: {
      "Content-Type": API_CATALOG_CONTENT_TYPE,
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
