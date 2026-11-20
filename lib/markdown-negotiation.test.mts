import assert from "node:assert/strict"
import test from "node:test"
import { markdownAssetPathFor, maybeServeMarkdown } from "./markdown-negotiation.ts"

test("markdownAssetPathFor maps page paths to their .md twin", () => {
  assert.equal(markdownAssetPathFor("/"), "/index.md")
  assert.equal(markdownAssetPathFor("/categorias"), "/categorias.md")
  assert.equal(markdownAssetPathFor("/docs"), "/docs.md")
  assert.equal(markdownAssetPathFor("/logo/mercado-pago"), "/logo/mercado-pago.md")
  assert.equal(markdownAssetPathFor("/logo/mercado-pago/"), "/logo/mercado-pago.md")
  assert.equal(markdownAssetPathFor("/categoria/bancos"), "/categoria/bancos.md")
  assert.equal(markdownAssetPathFor("/guia/excel"), "/guia/excel.md")
})

test("markdownAssetPathFor ignores assets, APIs and pages without a twin", () => {
  for (const pathname of [
    "/categoria/banderas",
    "/logos/uala.png",
    "/logo/uala.md",
    "/api/logos",
    "/sitemap.xml",
    "/logo/a/b",
  ]) {
    assert.equal(markdownAssetPathFor(pathname), null, pathname)
  }
})

function assetsStub(found: Record<string, string>) {
  const requested: string[] = []
  return {
    requested,
    fetch: async (request: Request) => {
      const { pathname } = new URL(request.url)
      requested.push(pathname)
      const body = found[pathname]
      return body === undefined
        ? new Response("not found", { status: 404 })
        : new Response(body, { headers: { "X-Robots-Tag": "noindex" } })
    },
  }
}

test("maybeServeMarkdown serves the twin only when markdown is preferred", async () => {
  const ASSETS = assetsStub({ "/logo/uala.md": "# Logo Ualá" })
  const url = "https://loguitos.app/logo/uala"

  const html = await maybeServeMarkdown(
    new Request(url, { headers: { Accept: "text/html,*/*;q=0.8" } }),
    { ASSETS },
  )
  assert.equal(html, null)
  assert.deepEqual(ASSETS.requested, [])

  const markdown = await maybeServeMarkdown(
    new Request(url, { headers: { Accept: "text/markdown" } }),
    { ASSETS },
  )
  assert.ok(markdown)
  assert.equal(markdown.headers.get("content-type"), "text/markdown; charset=utf-8")
  assert.equal(markdown.headers.get("vary"), "Accept")
  // The canonical URL must stay indexable: asset-only headers are not forwarded.
  assert.equal(markdown.headers.get("x-robots-tag"), null)
  assert.equal(await markdown.text(), "# Logo Ualá")
})

test("maybeServeMarkdown falls through when the twin is missing", async () => {
  const ASSETS = assetsStub({})
  const response = await maybeServeMarkdown(
    new Request("https://loguitos.app/logo/no-existe", {
      headers: { Accept: "text/markdown" },
    }),
    { ASSETS },
  )
  assert.equal(response, null)
  assert.deepEqual(ASSETS.requested, ["/logo/no-existe.md"])
})
