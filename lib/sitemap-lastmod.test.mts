import assert from "node:assert/strict"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import manifestJson from "../data/sitemap-lastmod.json" with { type: "json" }
import { getSitemapEntries } from "./sitemap-entries.ts"
import {
  computePageHashes,
  reconcileLastmod,
  stalePaths,
  type LastmodManifest,
} from "./sitemap-lastmod.ts"
import { serializeSitemapXml } from "./sitemap-xml.ts"

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public")
const manifest = manifestJson as LastmodManifest

test("reconcileLastmod keeps dates for unchanged pages and stamps changed ones", () => {
  const previous: LastmodManifest = {
    "/logo/a": { hash: "h1", lastmod: "2026-01-01" },
    "/logo/b": { hash: "h2", lastmod: "2026-01-02" },
    "/logo/gone": { hash: "h3", lastmod: "2026-01-03" },
  }
  const next = reconcileLastmod(
    previous,
    { "/logo/a": "h1", "/logo/b": "changed", "/logo/new": "h4" },
    "2026-06-01",
  )
  assert.deepEqual(next, {
    "/logo/a": { hash: "h1", lastmod: "2026-01-01" },
    "/logo/b": { hash: "changed", lastmod: "2026-06-01" },
    "/logo/new": { hash: "h4", lastmod: "2026-06-01" },
  })
})

test("data/sitemap-lastmod.json matches the current catalog", () => {
  const stale = stalePaths(manifest, computePageHashes(publicDir))
  assert.deepEqual(
    stale,
    [],
    "Run `pnpm sync:sitemap-lastmod` and commit data/sitemap-lastmod.json",
  )
})

test("every sitemap URL has a real lastmod, none in the future", () => {
  const today = new Date().toISOString().slice(0, 10)
  for (const entry of getSitemapEntries()) {
    assert.ok(entry.lastModified, `missing lastmod for ${entry.url}`)
    const day = entry.lastModified.toISOString().slice(0, 10)
    assert.match(day, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(day <= today, `${entry.url} lastmod ${day} is in the future`)
  }
})

test("sitemap lists self-hosted logo images on their logo page", () => {
  const entries = getSitemapEntries()
  const uala = entries.find((entry) => entry.url.endsWith("/logo/uala"))
  assert.deepEqual(uala?.images, ["https://loguitos.app/logos/uala.png"])
  for (const entry of entries) {
    for (const image of entry.images ?? []) {
      assert.match(image, /^https:\/\/loguitos\.app\/logos\/[a-z0-9-]+\.(png|svg)$/)
    }
  }

  const xml = serializeSitemapXml(entries)
  assert.match(xml, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/)
  assert.match(
    xml,
    /<image:image>\s*<image:loc>https:\/\/loguitos\.app\/logos\/uala\.png<\/image:loc>\s*<\/image:image>/,
  )
  assert.equal((xml.match(/<loc>/g) ?? []).length, entries.length)
  assert.match(xml, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
})
