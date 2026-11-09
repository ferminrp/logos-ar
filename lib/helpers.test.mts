import assert from "node:assert/strict"
import test from "node:test"
import { prefersMarkdown } from "./accept.ts"
import { slugify } from "./entity-index.ts"
import { entityMatchesSearchQuery } from "./entity-search.ts"
import { getEntityLogoSource, getEntityLogoUrl, resolveEntityLogoUrl } from "./entity-logo.ts"
import { getGoogleCurl, getGoogleFaviconUrl } from "./favicon-urls.ts"

test("slugify strips accents and punctuation", () => {
  assert.equal(slugify("Banco de la Nación Argentina"), "banco-de-la-nacion-argentina")
  assert.equal(slugify("Wyndham / Howard Johnson"), "wyndham-howard-johnson")
  assert.equal(slugify("  Molino Cañuelas! "), "molino-canuelas")
})

test("entityMatchesSearchQuery is accent- and case-insensitive and uses aliases", () => {
  const entity = { name: "Banco Supervielle", domain: "supervielle.com.ar", seoAliases: ["Superville"] }
  assert.equal(entityMatchesSearchQuery(entity, "SUPERVIELLE"), true)
  assert.equal(entityMatchesSearchQuery(entity, "superville"), true)
  assert.equal(entityMatchesSearchQuery({ name: "Nación", domain: "bna.com.ar" }, "nacion"), true)
  assert.equal(entityMatchesSearchQuery(entity, "galicia"), false)
  assert.equal(entityMatchesSearchQuery(entity, "   "), true)
})

test("prefersMarkdown follows Accept quality values", () => {
  assert.equal(prefersMarkdown(null), false)
  assert.equal(prefersMarkdown("text/html"), false)
  assert.equal(prefersMarkdown("text/markdown"), true)
  assert.equal(prefersMarkdown("text/markdown;q=0.5, text/html"), false)
  assert.equal(prefersMarkdown("text/html;q=0.5, text/markdown"), true)
  assert.equal(prefersMarkdown("*/*, text/markdown"), true)
})

test("getEntityLogoUrl prefers explicit logoUrl, then override, then Google", () => {
  assert.equal(getEntityLogoUrl({ domain: "x.com", logoUrl: "/logos/x.png" }), "/logos/x.png")
  assert.equal(
    getEntityLogoUrl({ domain: "no-override.example" }),
    getGoogleFaviconUrl("no-override.example", 128),
  )
  assert.equal(getEntityLogoSource({ domain: "no-override.example" }), "google")
  assert.equal(getEntityLogoSource({ domain: "x.com", logoUrl: "/logos/x.png" }), "hosted")
})

test("resolveEntityLogoUrl makes hosted paths absolute", () => {
  assert.equal(resolveEntityLogoUrl("/logos/a.png", "https://loguitos.app"), "https://loguitos.app/logos/a.png")
  assert.equal(resolveEntityLogoUrl("/logos/a.png", "https://loguitos.app/"), "https://loguitos.app/logos/a.png")
  assert.equal(resolveEntityLogoUrl("https://cdn.x/a.png", "https://loguitos.app"), "https://cdn.x/a.png")
})

test("getGoogleCurl builds a safe filename", () => {
  assert.equal(
    getGoogleCurl("bna.com.ar"),
    'curl "https://s2.googleusercontent.com/s2/favicons?domain=bna.com.ar&sz=128" -o bna_com_ar_favicon.png',
  )
})
