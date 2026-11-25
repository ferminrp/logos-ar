import assert from "node:assert/strict"
import test from "node:test"
import { getSitemapEntries } from "./sitemap-entries.ts"
import { GONE_LOGO_SLUGS } from "./gone-logo-slugs.ts"
import { getAllEntities } from "./entity-index.ts"
import {
  ENTITY_META_DESCRIPTION_MAX_LENGTH,
  ENTITY_META_DESCRIPTION_MIN_LENGTH,
  ENTITY_SEO_OVERRIDES,
  MAX_ENTITY_TITLE_LENGTH,
  buildEntityMetaDescription,
  buildEntityPageTitle,
  buildUniqueEntityPageTitles,
  getEntityPageTitle,
} from "./entity-seo.ts"

const CTR_LOW_IMPRESSION_LOGO_SLUGS = [
  "arca-ex-afip",
  "jumbo",
  "mercado-pago",
  "mercado-libre",
  "tn",
  "infobae",
  "la-serenisima-mastellone",
  "swiss-medical",
  "bbva-argentina",
  "naranja-x",
  "pedidosya",
  "brubank",
  "banco-provincia",
] as const

const GSC_PRIORITY_LOGO_SLUGS = [
  "arca-ex-afip",
  "mercado-libre",
  "tn",
  "modo",
  "naranja-x",
  "swiss-medical",
  "la-serenisima-mastellone",
  "personal-pay",
  "audi",
  "banco-provincia",
  "coto",
  "pami",
  "mercado-pago",
  "bbva-argentina",
  "fravega",
  "infobae",
  "banco-de-la-nacion-argentina",
] as const

test("entity page titles fit length budget without ellipsis", () => {
  const entities = getAllEntities()
  const titles = buildUniqueEntityPageTitles(entities)

  assert.equal(titles.size, entities.length)

  for (const entity of entities) {
    const title = titles.get(entity.slug)!
    assert.ok(!title.includes("…"), `title for ${entity.slug} contains ellipsis: ${title}`)
    assert.ok(
      title.length <= MAX_ENTITY_TITLE_LENGTH,
      `title for ${entity.slug} exceeds ${MAX_ENTITY_TITLE_LENGTH}: ${title.length} (${title})`,
    )
    assert.ok(title.endsWith("| Loguitos"), title)
  }
})

test("entity page titles are unique across slugs", () => {
  const entities = getAllEntities()
  const titles = buildUniqueEntityPageTitles(entities)
  const seen = new Map<string, string>()

  for (const entity of entities) {
    const title = titles.get(entity.slug)!
    const prior = seen.get(title)
    assert.ok(
      prior === undefined,
      `duplicate title "${title}" for ${prior} and ${entity.slug}`,
    )
    seen.set(title, entity.slug)
  }
})

test("getEntityPageTitle matches resolved map", () => {
  const entities = getAllEntities()
  const resolved = buildUniqueEntityPageTitles(entities)

  for (const entity of entities) {
    if (ENTITY_SEO_OVERRIDES[entity.slug]) continue
    assert.equal(getEntityPageTitle(entity), resolved.get(entity.slug))
  }
})

test("short names use the full CTR format", () => {
  const galicia = getAllEntities().find((e) => e.slug === "banco-galicia")
  assert.ok(galicia)
  assert.equal(
    buildEntityPageTitle(galicia),
    "Logo Banco Galicia PNG y SVG gratis | Loguitos",
  )
})

test("long names degrade without cutting words", () => {
  const nacion = getAllEntities().find((e) => e.slug === "banco-de-la-nacion-argentina")
  assert.ok(nacion)
  const title = buildEntityPageTitle(nacion)
  assert.ok(!title.includes("…"))
  assert.ok(title.length <= MAX_ENTITY_TITLE_LENGTH)
  assert.match(title, /BNA/)
  assert.match(title, /Banco Nación/)
  assert.match(title, /PNG y SVG/)
  assert.match(title, /gratis/)
})

test("CTR low-impression logo overrides respect title and description budgets", () => {
  const entities = getAllEntities()

  for (const slug of CTR_LOW_IMPRESSION_LOGO_SLUGS) {
    const override = ENTITY_SEO_OVERRIDES[slug]
    assert.ok(override, `missing override for ${slug}`)
    assert.ok(
      override!.motivatingQueries && override!.motivatingQueries.length > 0,
      `${slug} should list motivating GSC queries`,
    )

    const entity = entities.find((e) => e.slug === slug)
    assert.ok(entity, `missing entity ${slug}`)

    const title = getEntityPageTitle(entity!)
    const description = buildEntityMetaDescription(entity!)
    assert.equal(title, override!.title)
    assert.equal(description, override!.metaDescription)
    assert.ok(title.length <= MAX_ENTITY_TITLE_LENGTH, `${slug} title: ${title.length}`)
    assert.ok(
      description.length >= ENTITY_META_DESCRIPTION_MIN_LENGTH &&
        description.length <= ENTITY_META_DESCRIPTION_MAX_LENGTH,
      `${slug} description length ${description.length}: ${description}`,
    )
    assert.match(title, /PNG y SVG/i, `${slug} title`)
  }
})

test("GSC priority logo pages include PNG/SVG and descarga gratis in metadata", () => {
  for (const slug of GSC_PRIORITY_LOGO_SLUGS) {
    const entity = getAllEntities().find((e) => e.slug === slug)
    assert.ok(entity, `missing entity ${slug}`)
    const title = buildEntityPageTitle(entity)
    const description = buildEntityMetaDescription(entity)
    assert.ok(title.length <= MAX_ENTITY_TITLE_LENGTH, `${slug} title: ${title}`)
    assert.match(title, /PNG y SVG/i, `${slug} title`)
    assert.match(title, /gratis/i, `${slug} title`)
    assert.match(description, /PNG y SVG/i, `${slug} description`)
    assert.match(description, /gratis/i, `${slug} description`)
  }
})

test("gone logo slugs are not listed in the sitemap", () => {
  const urls = getSitemapEntries().map((entry) => entry.url)
  for (const slug of GONE_LOGO_SLUGS) {
    assert.ok(
      !urls.some((url) => url.endsWith(`/logo/${slug}`)),
      `sitemap still includes /logo/${slug}`,
    )
  }
})
