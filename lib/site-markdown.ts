import { categories } from "@/lib/logos-data"
import { FLAGS_CATEGORY, flagsTotalCount } from "@/lib/flags-data"
import { getAllEntities } from "@/lib/entity-index"
import { getSiteUrl } from "@/lib/site-url"

const HOME_TITLE = "Logos Argentina - Directorio de Favicons"
const HOME_DESCRIPTION =
  "Directorio de logos de bancos, fintechs y ALyCs de Argentina. Copiá los curls para usar en tu web."

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

export function getMarkdownForPath(pathname: string): string | null {
  switch (pathname) {
    case "/":
      return getHomeMarkdown()
    case "/categorias":
      return getCategoriasMarkdown()
    default:
      return null
  }
}
