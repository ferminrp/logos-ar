import assert from "node:assert/strict"
import test from "node:test"
import { getAllEntities } from "./entity-index.ts"
import {
  MAX_ENTITY_TITLE_LENGTH,
  buildEntityPageTitle,
  buildUniqueEntityPageTitles,
  getEntityPageTitle,
} from "./entity-seo.ts"

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
    assert.notEqual(
      prior,
      title,
      `duplicate title "${title}" for ${prior} and ${entity.slug}`,
    )
    seen.set(title, entity.slug)
  }
})

test("getEntityPageTitle matches resolved map", () => {
  const entities = getAllEntities()
  const resolved = buildUniqueEntityPageTitles(entities)

  for (const entity of entities) {
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
  assert.match(title, /^Logo Banco de la Nación( Argentina)? PNG y SVG( gratis)? \| Loguitos$/)
})
