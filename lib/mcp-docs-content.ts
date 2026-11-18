import { TOOL_DEFINITIONS } from '@/lib/mcp/tools'
import { getSiteUrl } from '@/lib/site-url'

export const MCP_ENDPOINT_PATH = '/mcp'

export function getMcpEndpointUrl(siteUrl = getSiteUrl()): string {
  return `${siteUrl}${MCP_ENDPOINT_PATH}`
}

export const MCP_DOCS_INTRO =
  'Servidor MCP público sin autenticación en el mismo origen que la API de logos. Transporte streamable-http (POST JSON-RPC 2.0: initialize, tools/list, tools/call).'

export const MCP_CLIENT_STEPS = [
  {
    name: 'Cursor',
    steps: [
      'Abrí la configuración de MCP de Cursor (global o por proyecto).',
      'Agregá un servidor HTTP apuntando a la URL del MCP (sin autenticación).',
      'Documentación: https://cursor.com/docs/mcp',
    ],
  },
  {
    name: 'Claude (web y escritorio)',
    steps: [
      'En Customize › Connectors, agregá un conector MCP remoto.',
      'Pegá la URL del endpoint y elegí sin autenticación.',
      'Guía: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
    ],
  },
  {
    name: 'Cliente MCP genérico',
    steps: [
      'GET /mcp devuelve un descriptor JSON; POST envía JSON-RPC.',
      'Discovery: GET /.well-known/mcp.json',
    ],
  },
] as const

export function formatToolListMarkdown(): string {
  return TOOL_DEFINITIONS.map(
    (tool) => `- **${tool.name}**: ${tool.description}`,
  ).join('\n')
}

export const MCP_GA4_NOTE = `Cada tools/call exitoso dispara un evento server-side GA4 \`mcp_tool_call\` con parámetro \`tool_name\` (Measurement Protocol, ID G-GZLZ092Z7S). Requiere el secret \`GA4_API_SECRET\` en el Worker; si falta, se omite. Para validar, repetí la llamada con el header \`X-Ga-Debug: 1\` y revisá la respuesta de https://www.google-analytics.com/debug/mp/collect.`