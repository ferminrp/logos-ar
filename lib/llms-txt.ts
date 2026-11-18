import { getSiteUrl } from '@/lib/site-url'
import { TOOL_NAMES } from '@/lib/mcp/tools'

export function buildLlmsTxt(siteUrl = getSiteUrl()): string {
  const tools = TOOL_NAMES.join(', ')
  return [
    '# Loguitos (loguitos.app)',
    '',
    '> Directorio gratuito de logos y favicons de entidades financieras argentinas (bancos, fintechs, crypto, prepagas, banderas).',
    '',
    'Catálogo estático servido con Astro en Cloudflare Workers. Sin API key.',
    '',
    '## Datos',
    '',
    `- [API JSON](${siteUrl}/api/logos): mismos filtros que el buscador (q, domain, category, limit, offset).`,
    `- [Documentación API](${siteUrl}/docs)`,
    `- [MCP](${siteUrl}/mcp): MCP público sin autenticación (streamable-http JSON-RPC: initialize, tools/list, tools/call). Tools: ${tools}. Discovery: ${siteUrl}/.well-known/mcp.json`,
    '',
    '## Páginas',
    '',
    `- [Inicio](${siteUrl}/)`,
    `- [Categorías](${siteUrl}/categorias)`,
    `- [Banderas](${siteUrl}/categoria/banderas)`,
    '',
  ].join('\n')
}