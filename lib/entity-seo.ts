import { getAllEntities, type EntityRecord } from "./entity-index.ts"

export const SITE_SUFFIX = " | Loguitos"
export const MAX_ENTITY_TITLE_LENGTH = 60

const TITLE_MIDDLE_VARIANTS = [
  " PNG y SVG gratis",
  " PNG y SVG",
  "",
] as const

function stripTrailingParens(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim()
}

function composeEntityTitle(displayName: string, middle: string): string {
  return `Logo ${displayName}${middle}${SITE_SUFFIX}`
}

function splitDisambiguationSuffix(name: string): { core: string; suffix: string } {
  const match = name.match(/^(.*)\s(\([^)]+\))$/)
  if (!match) return { core: name, suffix: "" }
  return { core: match[1].trim(), suffix: ` ${match[2]}` }
}

function shortenNameAtWordBoundary(name: string, middle: string): string | null {
  const { core, suffix } = splitDisambiguationSuffix(name)
  const words = core.split(/\s+/).filter(Boolean)
  while (words.length > 1) {
    words.pop()
    const candidate = words.join(" ") + suffix
    if (composeEntityTitle(candidate, middle).length <= MAX_ENTITY_TITLE_LENGTH) {
      return candidate
    }
  }
  if (words.length === 1) {
    const single = words[0] + suffix
    if (composeEntityTitle(single, middle).length <= MAX_ENTITY_TITLE_LENGTH) {
      return single
    }
  }
  return null
}

function buildTitleForDisplayName(displayName: string): string {
  for (const middle of TITLE_MIDDLE_VARIANTS) {
    const full = composeEntityTitle(displayName, middle)
    if (full.length <= MAX_ENTITY_TITLE_LENGTH) {
      return full
    }

    const shortened = shortenNameAtWordBoundary(displayName, middle)
    if (shortened) {
      return composeEntityTitle(shortened, middle)
    }
  }

  const { core, suffix } = splitDisambiguationSuffix(displayName)
  const fallbackCore = core.split(/\s+/)[0] ?? core
  const fallbackName = suffix ? `${fallbackCore}${suffix}` : fallbackCore
  return composeEntityTitle(fallbackName, "")
}

export function buildEntityPageTitle(entity: EntityRecord): string {
  const displayName = stripTrailingParens(entity.name)
  return buildTitleForDisplayName(displayName)
}

function disambiguationLabel(entity: EntityRecord): string {
  const shortCategory = entity.categoryName.replace(/\s+argentin[^\s]*$/i, "").trim()
  return shortCategory || entity.categoryName
}

function buildTitleWithQualifier(entity: EntityRecord, qualifier: string): string {
  const base = stripTrailingParens(entity.name)
  const displayName = `${base} (${qualifier})`
  return buildTitleForDisplayName(displayName)
}

export function buildUniqueEntityPageTitles(
  entities: EntityRecord[],
): Map<string, string> {
  const titles = new Map<string, string>()

  for (const entity of entities) {
    titles.set(entity.slug, buildEntityPageTitle(entity))
  }

  const byTitle = new Map<string, EntityRecord[]>()
  for (const entity of entities) {
    const title = titles.get(entity.slug)!
    const group = byTitle.get(title) ?? []
    group.push(entity)
    byTitle.set(title, group)
  }

  for (const group of byTitle.values()) {
    if (group.length < 2) continue

    for (const entity of group) {
      const qualified = buildTitleWithQualifier(entity, disambiguationLabel(entity))
      titles.set(entity.slug, qualified)
    }
  }

  const stillByTitle = new Map<string, string[]>()
  for (const [slug, title] of titles) {
    const slugs = stillByTitle.get(title) ?? []
    slugs.push(slug)
    stillByTitle.set(title, slugs)
  }

  for (const [title, slugs] of stillByTitle) {
    if (slugs.length < 2) continue
    for (let i = 0; i < slugs.length; i++) {
      const entity = entities.find((e) => e.slug === slugs[i])!
      const qualified = buildTitleWithQualifier(entity, entity.slug)
      titles.set(entity.slug, qualified)
    }
  }

  return titles
}

let cachedTitlesBySlug: Map<string, string> | null = null

export function getEntityPageTitle(entity: EntityRecord): string {
  if (!cachedTitlesBySlug) {
    cachedTitlesBySlug = buildUniqueEntityPageTitles(getAllEntities())
  }
  return cachedTitlesBySlug.get(entity.slug) ?? buildEntityPageTitle(entity)
}

function formatAliasClause(aliases: string[] | undefined): string {
  if (!aliases?.length) return ""
  const unique = [...new Set(aliases.map((a) => a.trim()).filter(Boolean))]
  if (unique.length === 0) return ""
  if (unique.length === 1) return unique[0]
  if (unique.length === 2) return `${unique[0]} y ${unique[1]}`
  return `${unique.slice(0, 2).join(", ")} y más`
}

export function buildEntityMetaDescription(entity: EntityRecord): string {
  const aliasClause = formatAliasClause(entity.seoAliases)
  const aliasSentence = aliasClause
    ? ` También buscado como ${aliasClause}.`
    : ""

  return `Descargá el logo de ${entity.name} en PNG y SVG con fondo transparente. Descarga gratis para diseño, web y presentaciones.${aliasSentence} Dominio: ${entity.domain}.`
}

export function buildEntityImageAlt(entity: EntityRecord): string {
  const shortName = entity.name.replace(/\s*\([^)]*\)\s*$/, "").trim()
  return `logo ${shortName} png`
}
