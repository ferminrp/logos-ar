import { getSiteUrl } from '../site-url.ts'
import { mcpGetIntent } from './accept.ts'
import { handleJsonRpcBody } from './handler.ts'
import { TOOL_NAMES, type McpDeps } from './tools.ts'

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID, X-Ga-Debug',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, MCP-Protocol-Version',
  'Cache-Control': 'no-store',
}

export function mcpDescriptor(siteUrl: string) {
  return {
    name: 'loguitos',
    transport: 'streamable-http',
    mcp: 'POST JSON-RPC 2.0 to this URL (initialize, tools/list, tools/call). Auth: none.',
    api: `${siteUrl}/api/logos`,
    ui: siteUrl,
    tools: TOOL_NAMES,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Vary: 'Accept',
      ...CORS_HEADERS,
    },
  })
}

export function handleMcpOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      Allow: 'GET, POST, OPTIONS',
    },
  })
}

export function handleMcpGet(request: Request, siteUrl?: string): Response {
  const intent = mcpGetIntent(request.headers.get('accept'))
  if (intent.kind === 'sse') {
    return new Response(JSON.stringify({ error: 'SSE not supported; POST JSON-RPC' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Allow: 'GET, POST, OPTIONS',
        Vary: 'Accept',
        ...CORS_HEADERS,
      },
    })
  }
  return jsonResponse(mcpDescriptor(siteUrl ?? getSiteUrl()))
}

export async function handleMcpPost(
  request: Request,
  deps: McpDeps,
  serverName = 'loguitos',
): Promise<Response> {
  const raw = await request.text()
  const outcome = await handleJsonRpcBody(raw, deps, serverName)
  if (outcome.kind === 'ack') {
    return new Response(null, { status: 202, headers: CORS_HEADERS })
  }
  return jsonResponse(outcome.body)
}

export function mcpWellKnownDocument(siteUrl: string) {
  return {
    name: 'loguitos',
    description:
      'Public unauthenticated MCP for Argentine financial entity logos. Same dataset as GET /api/logos on loguitos.app.',
    endpoint: `${siteUrl}/mcp`,
    transport: 'streamable-http',
  }
}