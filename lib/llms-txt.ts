import { getSiteUrl } from '@/lib/site-url'
import { TOOL_NAMES } from '@/lib/mcp/tools'
import { categories } from '@/lib/logos-data'
import { getAllEntities } from '@/lib/entity-index'
import { FLAGS_CATEGORY, flagsTotalCount } from '@/lib/flags-data'
import { guides } from '@/lib/guide-data'

export function buildLlmsTxt(siteUrl = getSiteUrl()): string {
  const tools = TOOL_NAMES.join(', ')
  const totalEntities = getAllEntities().length

  return [
    '# Loguitos (loguitos.app)',
    '',
    `> Directorio gratuito de logos de marcas argentinas en PNG y SVG: ${totalEntities} bancos, fintechs, exchanges crypto, prepagas, medios, retail, organismos públicos y más, además de ${flagsTotalCount} banderas. Con API JSON y MCP públicos, sin API key.`,
    '',
    'Cada marca tiene una página en `/logo/<slug>` con descarga en PNG y SVG, la URL del logo lista para hotlink y la fórmula para Google Sheets. Toda página HTML tiene una versión Markdown: agregá `.md` a la URL (por ejemplo `/logo/mercado-pago.md`) o pedila con `Accept: text/markdown`.',
    '',
    'No somos fuente oficial de marca: para uso corporativo consultá el brand kit de cada organización.',
    '',
    '## Datos',
    '',
    `- [API JSON](${siteUrl}/api/logos): catálogo completo con filtros \`q\`, \`domain\`, \`category\`, \`limit\` y \`offset\`. Ejemplo: \`${siteUrl}/api/logos?q=galicia\`.`,
    `- [Documentación de la API](${siteUrl}/docs.md): parámetros, ejemplos y formato de respuesta.`,
    `- [MCP](${siteUrl}/mcp): MCP público sin autenticación (streamable-http JSON-RPC: initialize, tools/list, tools/call). Tools: ${tools}. Discovery: ${siteUrl}/.well-known/mcp.json`,
    `- Imagen de un logo: \`${siteUrl}/logos/<slug>.png\` para las marcas alojadas en el catálogo (el campo \`catalog_logo_url\` de la API indica la URL exacta).`,
    `- Descarga con formato y tamaño: \`${siteUrl}/api/logo-download?domain=<dominio>&format=png|svg&size=256\`.`,
    '',
    '## Categorías',
    '',
    ...categories.map(
      (category) =>
        `- [${category.name}](${siteUrl}/categoria/${category.id}.md): ${category.description} (${category.entities.length} logos).`,
    ),
    `- [${FLAGS_CATEGORY.name}](${siteUrl}/categoria/banderas): ${FLAGS_CATEGORY.description} (${flagsTotalCount} banderas).`,
    '',
    '## Guías',
    '',
    ...guides.map(
      (guide) => `- [${guide.title}](${siteUrl}/guia/${guide.slug}.md): ${guide.description}`,
    ),
    '',
    '## Páginas',
    '',
    `- [Inicio](${siteUrl}/index.md): resumen del directorio y de cada categoría.`,
    `- [Todas las categorías](${siteUrl}/categorias.md)`,
    `- [Sitemap](${siteUrl}/sitemap.xml): todas las URLs, incluidas las ${totalEntities} páginas de logo.`,
    '',
  ].join('\n')
}
