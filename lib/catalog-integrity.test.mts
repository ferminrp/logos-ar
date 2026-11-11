/**
 * Offline integrity checks over the logo catalog. These run on every PR
 * (no network) and catch the data mistakes that otherwise only show up in
 * the nightly logo-quality run or in production.
 */
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import test from "node:test"
import overridesJson from "../data/logo-overrides.json" with { type: "json" }
import manualFixesJson from "../data/logo-manual-fixes.json" with { type: "json" }
import { categories } from "./logos-data.ts"
import { getAllEntities, getEntitySlugRedirects } from "./entity-index.ts"
import { getEntityLogoUrl } from "./entity-logo.ts"
import { listThirdPartyCatalogLogos } from "./catalog-logo-hosting.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, "../public")

const overrides = {
  ...(overridesJson as Record<string, { logoUrl: string }>),
  ...(manualFixesJson as Record<string, { logoUrl: string }>),
}

test("entity ids are unique", () => {
  const seen = new Map<number, string>()
  const dupes: string[] = []
  for (const category of categories) {
    for (const entity of category.entities) {
      const prev = seen.get(entity.id)
      if (prev !== undefined) dupes.push(`${entity.id}: ${prev} / ${entity.name}`)
      seen.set(entity.id, entity.name)
    }
  }
  assert.deepEqual(dupes, [])
})

test("entity slugs are unique and URL-safe", () => {
  const slugs = getAllEntities().map((entity) => entity.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `slug inválido: ${slug}`)
  }
})

test("slug aliases never shadow a real entity slug", () => {
  const slugs = new Set(getAllEntities().map((entity) => entity.slug))
  const shadowed = getEntitySlugRedirects()
    .map((redirect) => redirect.source.replace(/^\/logo\//, ""))
    .filter((alias) => slugs.has(alias))
  assert.deepEqual(shadowed, [])
})

test("entity domains are bare hostnames (no scheme, path or spaces)", () => {
  const bad = getAllEntities()
    .filter((entity) => !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(entity.domain))
    .map((entity) => `${entity.slug}: ${entity.domain}`)
  assert.deepEqual(bad, [])
})

test("hosted logos referenced by entities exist in public/", () => {
  const missing = getAllEntities()
    .map((entity) => ({ slug: entity.slug, url: getEntityLogoUrl(entity) }))
    .filter(({ url }) => url.startsWith("/"))
    .filter(({ url }) => !existsSync(path.join(publicDir, url)))
    .map(({ slug, url }) => `${slug}: ${url}`)
  assert.deepEqual(missing, [])
})

test("catalog tiles do not hotlink disallowed third-party logo hosts", () => {
  const thirdParty = listThirdPartyCatalogLogos(getAllEntities())
  assert.deepEqual(
    thirdParty.map((row) => `${row.slug}: ${row.logoUrl}`),
    [],
  )
})

test("hosted logos referenced by overrides exist in public/", () => {
  const missing = Object.entries(overrides)
    .filter(([, value]) => value.logoUrl.startsWith("/"))
    .filter(([, value]) => !existsSync(path.join(publicDir, value.logoUrl)))
    .map(([domain, value]) => `${domain}: ${value.logoUrl}`)
  assert.deepEqual(missing, [])
})
