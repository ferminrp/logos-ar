import { categories } from "@/lib/logos-data"
import { FLAGS_CATEGORY, flagsTotalCount } from "@/lib/flags-data"
import {
  getAllEntities,
  getCategoryById,
  getEntityBySlug,
  getRelatedEntities,
} from "@/lib/entity-index"
import { getAbsoluteEntityLogoUrl, getEntityLogoSource } from "@/lib/entity-logo"
import { getDuckDuckGoFaviconUrl, getSheetsImageFormula } from "@/lib/favicon-urls"
import { isGoneLogoSlug } from "@/lib/gone-logo-slugs"
import { getGuideBySlug, guides } from "@/lib/guide-data"
import { getCategorySeoCopy } from "@/lib/category-seo"
import { API_DOCS_MARKDOWN } from "@/lib/api-docs-markdown"
import { HOME_DESCRIPTION, HOME_TITLE } from "@/lib/site-brand"
import { getSiteUrl } from "@/lib/site-url"

const SAMPLE_PER_CATEGORY = 5

function formatEntityLine(name: string, domain: string): string {
  return `- ${name} (\`${domain}\`)`
}

function formatCategorySection(
  categoryName: string,
  description: string,
  entityCount: number,
  sampleNames: string[],
): string {
  const lines = [
    `### ${categoryName}`,
    "",
    `${description} (${entityCount} entidades).`,
    "",
    ...sampleNames,
  ]

  return lines.join("\n")
}

export function getHomeMarkdown(): string {
  const siteUrl = getSiteUrl()

  const categorySections = categories.map((category) => {
    const sample = category.entities
      .slice(0, SAMPLE_PER_CATEGORY)
      .map((entity) => formatEntityLine(entity.name, entity.domain))

    return formatCategorySection(
      category.name,
      category.description,
      category.entities.length,
      sample,
    )
  })

  return [
    `# ${HOME_TITLE}`,
    "",
    HOME_DESCRIPTION,
    "",
    `- **Entidades:** ${getAllEntities().length}`,
    `- **Banderas:** ${flagsTotalCount}`,
    `- **Categorías:** ${categories.length + 1}`,
    `- **API pública:** \`GET ${siteUrl}/api/logos\``,
    `- **Documentación:** ${siteUrl}/docs`,
    "",
    "## Categorías",
    "",
    ...categorySections.flatMap((section) => [section, ""]),
    `### ${FLAGS_CATEGORY.name}`,
    "",
    `${FLAGS_CATEGORY.description} (${flagsTotalCount} banderas).`,
    "",
    `- [Ver categoría](${siteUrl}/categoria/banderas)`,
    "",
    "## Enlaces",
    "",
    `- [Directorio completo](${siteUrl}/)`,
    `- [Todas las categorías](${siteUrl}/categorias)`,
    `- [API de logos](${siteUrl}/api/logos)`,
    `- [Documentación de la API](${siteUrl}/docs)`,
  ].join("\n")
}

export function getCategoriasMarkdown(): string {
  const siteUrl = getSiteUrl()

  const categorySections = categories.map((category) => {
    const sample = category.entities
      .slice(0, SAMPLE_PER_CATEGORY)
      .map((entity) => formatEntityLine(entity.name, entity.domain))

    const more =
      category.entities.length > SAMPLE_PER_CATEGORY
        ? `- … y ${category.entities.length - SAMPLE_PER_CATEGORY} más en [/${category.id}](${siteUrl}/categoria/${category.id})`
        : `- [Ver categoría](${siteUrl}/categoria/${category.id})`

    return [
      `### ${category.name}`,
      "",
      category.description,
      "",
      `**${category.entities.length} entidades** — [/${category.id}](${siteUrl}/categoria/${category.id})`,
      "",
      ...sample,
      more,
    ].join("\n")
  })

  return [
    "# Categorías de logos en Argentina",
    "",
    "Directorio de favicons organizado por rubro. Elegí una categoría para ver entidades, dominios y URLs de Google o DuckDuckGo listas para copiar.",
    "",
    "## Categorías",
    "",
    ...categorySections.flatMap((section) => [section, ""]),
    [
      `### ${FLAGS_CATEGORY.name}`,
      "",
      FLAGS_CATEGORY.description,
      "",
      `**${flagsTotalCount} banderas** — [/banderas](${siteUrl}/categoria/banderas)`,
      "",
      `- [Ver categoría](${siteUrl}/categoria/banderas)`,
    ].join("\n"),
    "",
    "## Enlaces",
    "",
    `- [Inicio](${siteUrl}/)`,
    `- [API de logos](${siteUrl}/api/logos)`,
    `- [Documentación de la API](${siteUrl}/docs)`,
  ].join("\n")
}

export function getCategoryMarkdown(categoryId: string): string | null {
  const category = getCategoryById(categoryId)
  if (!category) return null

  const siteUrl = getSiteUrl()
  const seo = getCategorySeoCopy(category)
  const entities = getAllEntities().filter(
    (entity) => entity.categoryId === category.id,
  )

  return [
    `# ${seo.h1}`,
    "",
    category.seoIntro,
    "",
    `**${entities.length} entidades.** Cada una tiene página propia con descarga en PNG y SVG.`,
    "",
    "## Logos",
    "",
    ...entities.map(
      (entity) =>
        `- [${entity.name}](${siteUrl}/logo/${entity.slug}) (\`${entity.domain}\`)`,
    ),
    "",
    "## Enlaces",
    "",
    `- [API JSON de esta categoría](${siteUrl}/api/logos?category=${category.id})`,
    `- [Todas las categorías](${siteUrl}/categorias)`,
    `- [Documentación de la API](${siteUrl}/docs)`,
  ].join("\n")
}

export function getLogoMarkdown(slug: string): string | null {
  if (isGoneLogoSlug(slug)) return null
  const entity = getEntityBySlug(slug)
  if (!entity) return null

  const siteUrl = getSiteUrl()
  const logoUrl = getAbsoluteEntityLogoUrl(entity)
  const hosted = getEntityLogoSource(entity) !== "google"
  const download = (format: "png" | "svg") =>
    `${siteUrl}/api/logo-download?domain=${encodeURIComponent(entity.domain)}&format=${format}&size=256`
  const related = getRelatedEntities(slug, 8)

  return [
    `# Logo ${entity.name}`,
    "",
    `Logo de ${entity.name} para descargar gratis en PNG y SVG. Categoría: [${entity.categoryName}](${siteUrl}/categoria/${entity.categoryId}).`,
    "",
    `- **Sitio oficial:** https://${entity.domain}`,
    `- **Página:** ${siteUrl}/logo/${entity.slug}`,
    `- **${hosted ? "Logo (PNG)" : "Favicon de Google"}:** ${logoUrl}`,
    `- **Favicon de DuckDuckGo:** ${getDuckDuckGoFaviconUrl(entity.domain)}`,
    `- **Descargar PNG:** ${download("png")}`,
    `- **Descargar SVG:** ${download("svg")}`,
    "",
    "## Uso",
    "",
    "HTML:",
    "",
    "```html",
    `<img src="${logoUrl}" alt="Logo de ${entity.name}" width="64" height="64" />`,
    "```",
    "",
    "Google Sheets:",
    "",
    "```",
    getSheetsImageFormula(logoUrl),
    "```",
    "",
    "API:",
    "",
    "```",
    `GET ${siteUrl}/api/logos?domain=${encodeURIComponent(entity.domain)}`,
    "```",
    "",
    "No somos fuente oficial de marca; para uso corporativo consultá las guías de cada organización.",
    ...(related.length > 0
      ? [
          "",
          `## Otros logos de ${entity.categoryName}`,
          "",
          ...related.map(
            (item) => `- [${item.name}](${siteUrl}/logo/${item.slug})`,
          ),
        ]
      : []),
  ].join("\n")
}

export function getGuideMarkdown(slug: string): string | null {
  const guide = getGuideBySlug(slug)
  if (!guide) return null

  const siteUrl = getSiteUrl()

  return [
    `# ${guide.title}`,
    "",
    guide.description,
    "",
    ...guide.sections.flatMap((section) => [
      `## ${section.heading}`,
      "",
      ...section.paragraphs.flatMap((paragraph) => [paragraph, ""]),
      ...(section.code ? ["```", section.code, "```", ""] : []),
    ]),
    "## Enlaces",
    "",
    `- [Directorio de logos](${siteUrl}/)`,
    ...guides
      .filter((item) => item.slug !== guide.slug)
      .map((item) => `- [${item.title}](${siteUrl}/guia/${item.slug})`),
  ].join("\n")
}

export function getDocsMarkdown(): string {
  return API_DOCS_MARKDOWN
}

export function getMarkdownForPath(pathname: string): string | null {
  switch (pathname) {
    case "/":
      return getHomeMarkdown()
    case "/categorias":
      return getCategoriasMarkdown()
    case "/docs":
      return getDocsMarkdown()
  }

  const match = /^\/(logo|categoria|guia)\/([^/]+)$/.exec(pathname)
  if (!match) return null
  const [, kind, slug] = match
  if (kind === "logo") return getLogoMarkdown(slug)
  if (kind === "categoria") return getCategoryMarkdown(slug)
  return getGuideMarkdown(slug)
}
