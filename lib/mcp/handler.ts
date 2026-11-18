import { MCP_INSTRUCTIONS, TOOL_DEFINITIONS, callTool, toolCallResponse, type McpDeps } from './tools.ts'
import {
  INTERNAL_ERROR,
  INVALID_PARAMS,
  METHOD_NOT_FOUND,
  PARSE_ERROR,
  isNotification,
  isRecord,
  jsonRpcError,
  jsonRpcResult,
  parseJsonRpcRequest,
  type JsonRpcId,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from './jsonrpc.ts'

const SUPPORTED_PROTOCOL_VERSIONS = [
  '2025-11-25',
  '2025-06-18',
  '2025-03-26',
  '2024-11-05',
] as const

const DEFAULT_PROTOCOL_VERSION = '2025-03-26'

export type RpcOutcome =
  | { kind: 'response'; body: JsonRpcResponse }
  | { kind: 'ack' }
  | { kind: 'parse_error'; body: JsonRpcResponse }

export async function handleJsonRpcBody(
  raw: string,
  deps: McpDeps,
  serverName: string,
): Promise<RpcOutcome> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      kind: 'parse_error',
      body: jsonRpcError(null, PARSE_ERROR, 'Parse error'),
    }
  }

  const request = parseJsonRpcRequest(parsed)
  if (!request.ok) {
    return { kind: 'response', body: request.error }
  }

  if (isNotification(request.request)) {
    return { kind: 'ack' }
  }

  const body = await dispatch(request.request, deps, serverName)
  return { kind: 'response', body }
}

async function dispatch(
  request: JsonRpcRequest,
  deps: McpDeps,
  serverName: string,
): Promise<JsonRpcResponse> {
  const id = request.id ?? null

  try {
    switch (request.method) {
      case 'initialize':
        return jsonRpcResult(id, initializeResult(request.params, serverName))
      case 'ping':
        return jsonRpcResult(id, {})
      case 'tools/list':
        return jsonRpcResult(id, { tools: TOOL_DEFINITIONS })
      case 'tools/call':
        return toolsCall(id, request.params, deps)
      default:
        return jsonRpcError(id, METHOD_NOT_FOUND, `Method not found: ${request.method}`)
    }
  } catch (error) {
    return jsonRpcError(
      id,
      INTERNAL_ERROR,
      'Internal error',
      error instanceof Error ? error.message : undefined,
    )
  }
}

function initializeResult(params: unknown, serverName: string) {
  const requested =
    isRecord(params) && typeof params.protocolVersion === 'string'
      ? params.protocolVersion
      : DEFAULT_PROTOCOL_VERSION
  const protocolVersion = (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(
    requested,
  )
    ? requested
    : DEFAULT_PROTOCOL_VERSION

  return {
    protocolVersion,
    capabilities: { tools: {} },
    serverInfo: { name: serverName, version: '1.0.0' },
    instructions: MCP_INSTRUCTIONS,
  }
}

function toolsCall(
  id: JsonRpcId,
  params: unknown,
  deps: McpDeps,
): JsonRpcResponse {
  if (!isRecord(params) || typeof params.name !== 'string') {
    return jsonRpcError(id, INVALID_PARAMS, 'name is required')
  }
  const args = 'arguments' in params ? params.arguments : {}
  const result = callTool(params.name, args, deps)
  return toolCallResponse(id, result)
}