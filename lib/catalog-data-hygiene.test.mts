/**
 * Offline hygiene checks for catalog data: duplicated brands, orphan assets and
 * overrides, category SEO copy and generated datasets. No network.
 */
import { readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import test from "node:test"
import overridesJson from "../data/logo-overrides.json" with { type: "json" }
import manualFixesJson from "../data/logo-manual-fixes.json" with { type: "json" }
import logosDataset from "../data/logos-dataset.json" with { type: "json" }
import flagsDataset from "../data/flags-dataset.json" with { type: "json" }
import { categories, type Category } from "./logos-data.ts"
import { getAllEntities, slugify } from "./entity-index.ts"
import { getEntityLogoSource, getEntityLogoUrl } from "./entity-logo.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logosDir = path.join(__dirname, "../public/logos")

function tokens(value: string): string[] {
  return slugify(value).split("-").filter(Boolean)
}

/** A short name ("Banco Nación", "IOL") resolves when all its words appear in one entity label. */
function resolvesToCategoryEntity(name: string, category: Category): boolean {
  const wanted = tokens(name)
  if (wanted.length === 0) return false
  return category.entities.some((entity) =>
    [entity.name, entity.slug ?? "", ...(entity.seoAliases ?? [])].some((label) => {
      const have = new Set(tokens(label))
      return wanted.every((token) => have.has(token))
    }),
  )
}

test("every seoTopEntities name resolves to an entity in its category", () => {
  const unresolved: string[] = []
  for (const category of categories) {
    for (const name of category.seoTopEntities) {
      if (!resolvesToCategoryEntity(name, category)) {
        unresolved.push(`${category.id}: ${name}`)
      }
    }
  }
  assert.deepEqual(unresolved, [])
})

test("category seoIntro does not hardcode entity counts", () => {
  const withCounts = categories
    .filter((category) => /\by \d+ [\p{L} ]*más\b/u.test(category.seoIntro))
    .map((category) => `${category.id}: ${category.seoIntro}`)
  assert.deepEqual(withCounts, [])
})

test("no two entities share the same domain", () => {
  const byDomain = new Map<string, string[]>()
  for (const entity of getAllEntities()) {
    const key = entity.domain.toLowerCase().replace(/^www\./, "")
    byDomain.set(key, [...(byDomain.get(key) ?? []), entity.slug])
  }
  const dupes = [...byDomain]
    .filter(([, slugs]) => slugs.length > 1)
    .map(([domain, slugs]) => `${domain}: ${slugs.join(", ")}`)
  assert.deepEqual(dupes, [])
})

test("every file in public/logos is referenced by an entity", () => {
  const referenced = new Set<string>()
  for (const entity of getAllEntities()) {
    const logoUrl = getEntityLogoUrl(entity)
    if (logoUrl.startsWith("/logos/")) referenced.add(logoUrl.slice("/logos/".length))
    // Vector companion served by /api/logo-download?format=svg.
    referenced.add(`${entity.slug}.svg`)
  }
  const orphans = readdirSync(logosDir).filter((file) => !referenced.has(file))
  assert.deepEqual(orphans, [])
})

test("every logo override key matches an entity domain", () => {
  const domains = new Set(getAllEntities().map((entity) => entity.domain.toLowerCase()))
  const orphanKeys = [
    ...Object.keys(overridesJson).map((key) => `logo-overrides.json: ${key}`),
    ...Object.keys(manualFixesJson).map((key) => `logo-manual-fixes.json: ${key}`),
  ].filter((entry) => !domains.has(entry.split(": ")[1].toLowerCase()))
  assert.deepEqual(orphanKeys, [])
})

test("logos dataset is in sync with the catalog and reports the real logo source", () => {
  const entities = getAllEntities()
  assert.equal(logosDataset.totalItems, entities.length)
  const byKey = new Map(entities.map((entity) => [`${entity.name}|${entity.domain}`, entity]))
  const mismatches: string[] = []
  for (const item of logosDataset.items) {
    const entity = byKey.get(`${item.name}|${item.domain}`)
    if (!entity) {
      mismatches.push(`${item.name}: no está en el catálogo`)
      continue
    }
    if (item.catalog_logo_url !== getEntityLogoUrl(entity)) {
      mismatches.push(`${item.name}: catalog_logo_url desactualizado`)
    }
    if (item.logo_source !== getEntityLogoSource(entity)) {
      mismatches.push(`${item.name}: logo_source ${item.logo_source}`)
    }
    const selfHosted = item.catalog_logo_url.startsWith("/")
    if (selfHosted !== (item.logo_source === "hosted")) {
      mismatches.push(`${item.name}: ${item.logo_source} para ${item.catalog_logo_url}`)
    }
  }
  assert.deepEqual(mismatches, [])
})

test("flags dataset has no pseudo-locale or unassigned codes", () => {
  const junk = flagsDataset.items
    .map((item) => item.code)
    .filter((code) => ["XA", "XC", "XO"].includes(code))
  assert.deepEqual(junk, [])
})
