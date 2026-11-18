export type McpGetIntent = { kind: 'descriptor' } | { kind: 'sse' }

/**
 * MCP clients GET with Accept including text/event-stream to open SSE.
 * Ordinary GET (browsers, curl, discovery) must still receive the JSON descriptor.
 */
export function mcpGetIntent(accept: string | null): McpGetIntent {
  if (!accept) return { kind: 'descriptor' }
  if (accept.toLowerCase().includes('text/event-stream')) {
    return { kind: 'sse' }
  }
  return { kind: 'descriptor' }
}

/** Browsers get the /mcp docs page; MCP clients (SSE or JSON) keep the server responses. */
export function prefersMcpDocsHtml(accept: string | null): boolean {
  if (!accept) return false
  const a = accept.toLowerCase()
  return a.includes('text/html') && !a.includes('text/event-stream')
}