import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prefersMarkdown } from "@/lib/accept"
import { getMarkdownForPath } from "@/lib/site-markdown"

const NEGOTIABLE_PATHS = new Set(["/", "/categorias"])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!NEGOTIABLE_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  if (!prefersMarkdown(request.headers.get("accept"))) {
    return NextResponse.next()
  }

  const markdown = getMarkdownForPath(pathname)
  if (!markdown) {
    return NextResponse.next()
  }

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}

export const config = {
  matcher: ["/", "/categorias"],
}
