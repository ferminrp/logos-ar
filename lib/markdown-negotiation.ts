import { prefersMarkdown } from "./accept.ts"

/** Pages that have a prerendered Markdown twin (`<path>.md`, home is `/index.md`). */
const MARKDOWN_PAGE_PATTERN = /^\/(?:categorias|docs|(?:logo|categoria|guia)\/[a-z0-9-]+)$/

export const MARKDOWN_RESPONSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "Cache-Control":
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
}

/** Asset path of the Markdown twin for an HTML page path, or null when there is none. */
export function markdownAssetPathFor(pathname: string): string | null {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
  if (normalized === "/") return "/index.md"
  if (normalized === "/categoria/banderas") return null
  return MARKDOWN_PAGE_PATTERN.test(normalized) ? `${normalized}.md` : null
}

type AssetsBinding = { fetch(request: Request): Promise<Response> }

/**
 * Worker-level content negotiation. Prerendered pages are served from static assets
 * without running Astro middleware, so `Accept: text/markdown` is resolved here by
 * swapping in the prerendered `.md` twin.
 */
export async function maybeServeMarkdown(
  request: Request,
  env: { ASSETS?: AssetsBinding },
): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null
  if (!prefersMarkdown(request.headers.get("accept"))) return null
  if (!env.ASSETS) return null

  let url: URL
  try {
    url = new URL(request.url)
  } catch {
    return null
  }

  const assetPath = markdownAssetPathFor(url.pathname)
  if (!assetPath) return null

  const assetResponse = await env.ASSETS.fetch(
    new Request(new URL(assetPath, url.origin), { method: request.method }),
  )
  if (!assetResponse.ok) return null

  return new Response(assetResponse.body, {
    status: 200,
    headers: MARKDOWN_RESPONSE_HEADERS,
  })
}
