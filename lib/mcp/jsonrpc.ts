export type JsonRpcId = string | number | null

export type JsonRpcRequest = {
  jsonrpc: '2.0'
  id?: JsonRpcId
  method: string
  params?: unknown
}

export type JsonRpcError = {
  code: number
  message: string
  data?: unknown
}

export type JsonRpcResponse = {
  jsonrpc: '2.0'
  id: JsonRpcId
  result?: unknown
  error?: JsonRpcError
}

export const PARSE_ERROR = -32700
export const INVALID_REQUEST = -32600
export const METHOD_NOT_FOUND = -32601
export const INVALID_PARAMS = -32602
export const INTERNAL_ERROR = -32603

export function jsonRpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  const error: JsonRpcError = { code, message }
  if (data !== undefined) error.data = data
  return { jsonrpc: '2.0', id, error }
}

export function jsonRpcResult(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseJsonRpcRequest(
  value: unknown,
): { ok: true; request: JsonRpcRequest } | { ok: false; error: JsonRpcResponse } {
  if (!isRecord(value)) {
    return {
      ok: false,
      error: jsonRpcError(null, INVALID_REQUEST, 'Request must be a JSON object'),
    }
  }
  if (value.jsonrpc !== '2.0') {
    return {
      ok: false,
      error: jsonRpcError(
        asId(value.id),
        INVALID_REQUEST,
        'jsonrpc must be "2.0"',
      ),
    }
  }
  if (typeof value.method !== 'string' || value.method.length === 0) {
    return {
      ok: false,
      error: jsonRpcError(asId(value.id), INVALID_REQUEST, 'method must be a string'),
    }
  }
  if (value.id !== undefined && !isValidId(value.id)) {
    return {
      ok: false,
      error: jsonRpcError(null, INVALID_REQUEST, 'id must be a string, number, or null'),
    }
  }

  return {
    ok: true,
    request: {
      jsonrpc: '2.0',
      method: value.method,
      ...(value.id !== undefined ? { id: value.id as JsonRpcId } : {}),
      ...(value.params !== undefined ? { params: value.params } : {}),
    },
  }
}

function isValidId(value: unknown): value is JsonRpcId {
  return value === null || typeof value === 'string' || typeof value === 'number'
}

function asId(value: unknown): JsonRpcId {
  return isValidId(value) ? value : null
}

export function isNotification(request: JsonRpcRequest): boolean {
  return request.id === undefined
}