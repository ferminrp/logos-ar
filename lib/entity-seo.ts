import type { EntityRecord } from "./entity-index.ts"

const SITE_SUFFIX = " | Loguitos"
const MAX_TITLE_LENGTH = 62

function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_LENGTH) return title
  const withoutSuffix = title.replace(SITE_SUFFIX, "")
  const budget = MAX_TITLE_LENGTH - SITE_SUFFIX.length - 1
  return `${withoutSuffix.slice(0, budget).trimEnd()}…${SITE_SUFFIX}`
}

function formatAliasClause(aliases: string[] | undefined): string {
  if (!aliases?.length) return ""
  const unique = [...new Set(aliases.map((a) => a.trim()).filter(Boolean))]
  if (unique.length === 0) return ""
  if (unique.length === 1) return unique[0]
  if (unique.length === 2) return `${unique[0]} y ${unique[1]}`
  return `${unique.slice(0, 2).join(", ")} y más`
}

export function buildEntityPageTitle(entity: EntityRecord): string {
  const aliasClause = formatAliasClause(entity.seoAliases)
  const baseName = entity.name.replace(/\s*\([^)]*\)\s*$/, "").trim()

  const title = aliasClause
    ? `Logo ${baseName} (${aliasClause}) PNG/SVG gratis, fondo transparente${SITE_SUFFIX}`
    : `Logo ${entity.name} (PNG/SVG): descarga gratis, fondo transparente${SITE_SUFFIX}`

  return truncateTitle(title)
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
