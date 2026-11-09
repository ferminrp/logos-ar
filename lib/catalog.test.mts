/**
 * Offline invariants for the logo catalog and the small pure helpers the
 * site depends on. No network: these run on every PR in a few hundred ms.
 */
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { prefersMarkdown } from "./accept.ts"
import {
  getAllEntities,
  getEntityBySlug,
  getEntitySlug,
  getRelatedEntities,
  slugify,
} from "./entity-index.ts"
import {
  getEntityLogoSource,
  getEntityLogoUrl,
  resolveEntityLogoUrl,
} from "./entity-logo.ts"
import { entityMatchesSearchQuery } from "./entity-search.ts"
import { getGoogleFaviconUrl } from "./favicon-urls.ts"
import { GONE_LOGO_SLUGS } from "./gone-logo-slugs.ts"
import { getPermanentRedirects } from "./permanent-redirects.mts"
import { categories } from "./logos-data.ts"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const publicDir = path.join(repoRoot, "public")
const readJson = (relative: string) =>
  JSON.parse(readFileSync(path.join(repoRoot, relative), "utf8"))

const entities = getAllEntities()

// --- catalog invariants ----------------------------------------------------

test("every entity has a unique slug", () => {
  const seen = new Map<string, string>()
  for (const entity of entities) {
    assert.ok(entity.slug, `${entity.name} has no slug`)
    assert.match(entity.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad slug ${entity.slug}`)
    assert.ok(
      !seen.has(entity.slug),
      `slug ${entity.slug} used by ${seen.get(entity.slug)} and ${entity.name}`,
    )
    seen.set(entity.slug, entity.name)
  }
})

// Legacy duplicates (turismo vs energia). Their ids are baked into live URLs
// (edenor-211, metrogas-214), so they stay; new entities must use fresh ids.
const LEGACY_DUPLICATE_IDS = new Set([211, 213, 214])

test("entity ids are unique (except frozen legacy duplicates)", () => {
  const ids = new Map<number, string>()
  for (const entity of entities) {
    if (!LEGACY_DUPLICATE_IDS.has(entity.id)) {
      assert.ok(!ids.has(entity.id), `id ${entity.id}: ${ids.get(entity.id)} / ${entity.name}`)
    }
    ids.set(entity.id, entity.name)
  }
})

test("getEntitySlug resolves every catalog entity to its own page", () => {
  // Regression: lookup by id sent Edenor/Camuzzi/Metrogas cards to
  // Wyndham/Avis/Dollar because those ids are shared.
  for (const category of categories) {
    for (const entity of category.entities) {
      const record = getEntityBySlug(getEntitySlug(entity))
      assert.ok(record, `${entity.name}: no page for ${getEntitySlug(entity)}`)
      assert.equal(record.name, entity.name)
      assert.equal(record.categoryId, category.id)
    }
  }
  assert.equal(getEntitySlug(getEntityBySlug("edenor-211")!), "edenor-211")
})

test("every entity domain is a bare lowercase hostname", () => {
  for (const entity of entities) {
    assert.match(
      entity.domain,
      /^[a-z0-9-]+(\.[a-z0-9-]+)+$/,
      `${entity.slug}: domain "${entity.domain}" should not include scheme, path or uppercase`,
    )
  }
})

test("every category has entities and a unique id", () => {
  const ids = new Set<string>()
  for (const category of categories) {
    assert.ok(!ids.has(category.id), `duplicate category ${category.id}`)
    ids.add(category.id)
    assert.ok(category.entities.length > 0, `category ${category.id} is empty`)
  }
})

test("slug aliases never shadow a live slug", () => {
  for (const entity of entities) {
    for (const alias of entity.slugAliases ?? []) {
      if (alias === entity.slug) continue
      const owner = getEntityBySlug(alias)
      assert.equal(owner, null, `alias ${alias} of ${entity.slug} is the slug of ${owner?.name}`)
    }
  }
})

test("gone slugs are not live entities", () => {
  for (const slug of GONE_LOGO_SLUGS) {
    assert.equal(getEntityBySlug(slug), null, `${slug} is marked gone but still exists`)
  }
})

// --- logos -----------------------------------------------------------------

test("every hosted logo file referenced by the catalog exists in public/", () => {
  const missing: string[] = []
  for (const entity of entities) {
    const url = getEntityLogoUrl(entity)
    if (url.startsWith("/") && !existsSync(path.join(publicDir, url))) {
      missing.push(`${entity.slug} -> ${url}`)
    }
  }
  assert.deepEqual(missing, [])
})

test("every hosted override in data/*.json points to an existing file", () => {
  const missing: string[] = []
  for (const file of ["data/logo-overrides.json", "data/logo-manual-fixes.json"]) {
    const overrides = readJson(file) as Record<string, { logoUrl: string; logoSource: string }>
    for (const [domain, override] of Object.entries(overrides)) {
      assert.ok(override.logoUrl, `${file}: ${domain} has no logoUrl`)
      if (override.logoUrl.startsWith("/")) {
        if (!existsSync(path.join(publicDir, override.logoUrl))) {
          missing.push(`${file}: ${domain} -> ${override.logoUrl}`)
        }
      } else {
        assert.match(override.logoUrl, /^https:\/\//, `${file}: ${domain} logoUrl must be https`)
      }
    }
  }
  assert.deepEqual(missing, [])
})

test("getEntityLogoUrl prefers explicit logoUrl, then override, then Google favicon", () => {
  assert.equal(
    getEntityLogoUrl({ domain: "bna.com.ar", logoUrl: "/logos/x.png" }),
    "/logos/x.png",
  )
  const overridden = getEntityLogoUrl({ domain: "bna.com.ar" })
  assert.notEqual(overridden, getGoogleFaviconUrl("bna.com.ar", 128))
  assert.equal(getEntityLogoSource({ domain: "bna.com.ar" }), "site")

  const fallback = getEntityLogoUrl({ domain: "no-override.example" }, 64)
  assert.equal(fallback, getGoogleFaviconUrl("no-override.example", 64))
  assert.equal(getEntityLogoSource({ domain: "no-override.example" }), "google")
  assert.equal(getEntityLogoSource({ domain: "x.example", logoUrl: "/logos/x.png" }), "hosted")
})

test("resolveEntityLogoUrl makes hosted paths absolute and leaves URLs alone", () => {
  assert.equal(
    resolveEntityLogoUrl("/logos/a.png", "https://loguitos.app"),
    "https://loguitos.app/logos/a.png",
  )
  assert.equal(
    resolveEntityLogoUrl("/logos/a.png", "https://loguitos.app/"),
    "https://loguitos.app/logos/a.png",
  )
  assert.equal(
    resolveEntityLogoUrl("https://cdn.example/a.png", "https://loguitos.app"),
    "https://cdn.example/a.png",
  )
})

// --- redirects -------------------------------------------------------------

test("committed permanent-redirects.json matches the generator", () => {
  // next.config.mjs reads the JSON at build time; a stale file silently
  // drops redirects. Regenerate with scripts/generate-permanent-redirects.mts.
  assert.deepEqual(readJson("data/permanent-redirects.json"), getPermanentRedirects())
})

test("every /logo redirect lands on a live entity", () => {
  for (const redirect of getPermanentRedirects()) {
    if (!redirect.destination.startsWith("/logo/")) continue
    const slug = redirect.destination.slice("/logo/".length)
    assert.ok(getEntityBySlug(slug), `${redirect.source} -> missing ${slug}`)
    assert.notEqual(redirect.source, redirect.destination)
  }
})

// --- helpers ---------------------------------------------------------------

test("slugify strips accents and punctuation", () => {
  assert.equal(slugify("Molino Cañuelas"), "molino-canuelas")
  assert.equal(slugify("  Banco Nación (BNA)  "), "banco-nacion-bna")
  assert.equal(slugify("ARCA ex-AFIP"), "arca-ex-afip")
  assert.equal(slugify("Swiss Medical®"), "swiss-medical")
})

test("getRelatedEntities stays in category and excludes the entity itself", () => {
  const entity = entities[0]
  const related = getRelatedEntities(entity.slug, 5)
  assert.ok(related.length <= 5)
  for (const record of related) {
    assert.equal(record.categoryId, entity.categoryId)
    assert.notEqual(record.slug, entity.slug)
  }
  assert.deepEqual(getRelatedEntities("does-not-exist"), [])
})

test("entityMatchesSearchQuery is accent- and case-insensitive and uses aliases", () => {
  const entity = { name: "Banco Nación", domain: "bna.com.ar", seoAliases: ["BNA"] }
  assert.equal(entityMatchesSearchQuery(entity, "nacion"), true)
  assert.equal(entityMatchesSearchQuery(entity, "NACIÓN"), true)
  assert.equal(entityMatchesSearchQuery(entity, "bna"), true)
  assert.equal(entityMatchesSearchQuery(entity, "bna.com"), true)
  assert.equal(entityMatchesSearchQuery(entity, "galicia"), false)
  assert.equal(entityMatchesSearchQuery(entity, "   "), true)
})

test("entityMatchesSearchQuery: every catalog entity is findable by its name", () => {
  for (const entity of entities) {
    assert.ok(entityMatchesSearchQuery(entity, entity.name), entity.slug)
  }
})

test("prefersMarkdown follows Accept q-values", () => {
  assert.equal(prefersMarkdown(null), false)
  assert.equal(prefersMarkdown("text/html"), false)
  assert.equal(prefersMarkdown("text/markdown"), true)
  assert.equal(prefersMarkdown("text/markdown, text/html"), true)
  assert.equal(prefersMarkdown("text/html, text/markdown;q=0.9"), false)
  assert.equal(prefersMarkdown("text/markdown;q=0.9, */*;q=0.1"), true)
  assert.equal(prefersMarkdown("text/markdown;q=0"), false)
  assert.equal(
    prefersMarkdown(
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    ),
    false,
  )
})
