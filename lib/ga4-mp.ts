export const GA4_MEASUREMENT_ID = 'G-GZLZ092Z7S'

export type Ga4Env = {
  GA4_API_SECRET?: string
}

type McpToolCallParams = {
  tool_name: string
}

function gaDebugEnabled(request: Request): boolean {
  if (request.headers.get('x-ga-debug') === '1') return true
  return false
}

export function buildMcpToolCallPayload(toolName: string): {
  client_id: string
  events: { name: string; params: McpToolCallParams }[]
} {
  const clientId = crypto.randomUUID()
  return {
    client_id: clientId,
    events: [
      {
        name: 'mcp_tool_call',
        params: { tool_name: toolName },
      },
    ],
  }
}

export async function sendMcpToolCallEvent(
  request: Request,
  env: Ga4Env,
  toolName: string,
): Promise<void> {
  const apiSecret = env.GA4_API_SECRET?.trim()
  if (!apiSecret) return

  const debug = gaDebugEnabled(request)
  const host = debug
    ? 'https://www.google-analytics.com/debug/mp/collect'
    : 'https://www.google-analytics.com/mp/collect'
  const url = new URL(host)
  url.searchParams.set('measurement_id', GA4_MEASUREMENT_ID)
  url.searchParams.set('api_secret', apiSecret)

  const body = buildMcpToolCallPayload(toolName)

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // Best-effort analytics; never fail the MCP response.
  }
}

export function scheduleMcpToolCallEvent(
  request: Request,
  ctx: { waitUntil: (promise: Promise<unknown>) => void } | undefined,
  env: Ga4Env,
  toolName: string,
): void {
  const work = sendMcpToolCallEvent(request, env, toolName)
  if (ctx?.waitUntil) {
    ctx.waitUntil(work)
    return
  }
  void work
}