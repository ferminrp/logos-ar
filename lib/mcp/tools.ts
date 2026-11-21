import {
  DEFAULT_CATALOG_LIMIT,
  KNOWN_CATEGORIES,
  MAX_CATALOG_LIMIT,
  queryLogosCatalog,
} from '../logos-catalog.ts'
import {
  catalogItemToMcpSummary,
  listCategoryMeta,
  resolveLogoBySlugOrName,
} from './logo-present.ts'
import { queryMcpLogosCatalog } from './search-catalog.ts'
import {
  INTERNAL_ERROR,
  INVALID_PARAMS,
  isRecord,
  jsonRpcError,
  jsonRpcResult,
  type JsonRpcId,
  type JsonRpcResponse,
} from './jsonrpc.ts'

export const MCP_SEARCH_DEFAULT_LIMIT = 25
export const MCP_SEARCH_MAX_LIMIT = 100

export type McpDeps = {
  siteUrl: string
  onToolCall?: (toolName: string) => void
}

export type ToolDefinition = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

const SEARCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    query: {
      type: 'string',
      description:
        'Texto para buscar por nombre de entidad, slug de ficha (/logo/…) o dominio. No distingue mayúsculas.',
    },
    category: {
      type: 'string',
      description:
        'Categoría opcional: bancos, fintechs, crypto, tecnologias, prepagas, banderas, etc.',
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: MCP_SEARCH_MAX_LIMIT,
      description: `Máximo de resultados. Default ${MCP_SEARCH_DEFAULT_LIMIT}, máx ${MCP_SEARCH_MAX_LIMIT}.`,
    },
    offset: {
      type: 'integer',
      minimum: 0,
      description: 'Desplazamiento para paginar cuando hasMore es true. Default 0.',
    },
  },
} as const

const GET_LOGO_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    slug: {
      type: 'string',
      description: 'Slug de la ficha en loguitos.app (ej. banco-galicia) o código ISO de bandera.',
    },
    name: {
      type: 'string',
      description: 'Nombre de la entidad (alternativa a slug).',
    },
  },
} as const

const LIST_BY_CATEGORY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['category'],
  properties: {
    category: {
      type: 'string',
      description: 'ID de categoría (bancos, fintechs, crypto, banderas, …).',
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: MAX_CATALOG_LIMIT,
      description: `Máximo de filas. Default ${DEFAULT_CATALOG_LIMIT}, máx ${MAX_CATALOG_LIMIT}.`,
    },
    offset: {
      type: 'integer',
      minimum: 0,
      description: 'Desplazamiento para paginar. Default 0.',
    },
  },
} as const

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'search_logos',
    description:
      'Busca logos del catálogo argentino (misma fuente que GET /api/logos). Devuelve nombres, slugs, categorías y URLs absolutas de PNG/SVG en loguitos.app. Human UI: https://loguitos.app',
    inputSchema: SEARCH_SCHEMA,
  },
  {
    name: 'get_logo',
    description:
      'Un logo por slug o nombre. URLs absolutas https://loguitos.app/… para PNG, SVG, ficha y metadata. svgIsVector indica si el SVG es un vector real o el PNG embebido. Banderas incluyen svgUrl externo (country-flag-icons).',
    inputSchema: GET_LOGO_SCHEMA,
  },
  {
    name: 'list_categories',
    description:
      'Lista categorías del directorio (bancos, fintechs, crypto, banderas, …) con conteos y rutas.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  },
  {
    name: 'list_by_category',
    description:
      'Lista entidades de una categoría con las mismas URLs absolutas que search_logos.',
    inputSchema: LIST_BY_CATEGORY_SCHEMA,
  },
]

export const TOOL_NAMES = TOOL_DEFINITIONS.map((tool) => tool.name)

export const MCP_INSTRUCTIONS =
  'MCP público sin autenticación para logos de entidades financieras argentinas. Datos del mismo dataset que GET /api/logos en loguitos.app. Las URLs PNG/SVG apuntan a /api/logo-download en el sitio canónico. Human UI: https://loguitos.app'

type ToolResult =
  | { ok: true; payload: unknown }
  | { ok: false; code: number; message: string; data?: unknown }

function parseLimit(
  value: unknown,
  fallback: number,
  max: number,
): number | { error: string } {
  if (value === undefined) return fallback
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return { error: 'limit must be an integer' }
  }
  if (value < 1 || value > max) {
    return { error: `limit must be between 1 and ${max}` }
  }
  return value
}

function searchLogos(args: unknown, deps: McpDeps): ToolResult {
  if (args !== undefined && !isRecord(args)) {
    return { ok: false, code: INVALID_PARAMS, message: 'arguments must be an object' }
  }
  const rawQuery = args?.query
  const rawCategory = args?.category
  if (rawQuery !== undefined && typeof rawQuery !== 'string') {
    return { ok: false, code: INVALID_PARAMS, message: 'query must be a string' }
  }
  if (rawCategory !== undefined && typeof rawCategory !== 'string') {
    return { ok: false, code: INVALID_PARAMS, message: 'category must be a string' }
  }
  const query = rawQuery ?? ''
  const category = rawCategory?.trim() ? rawCategory : undefined
  if (category && !KNOWN_CATEGORIES.has(category.trim().toLowerCase())) {
    return {
      ok: false,
      code: INVALID_PARAMS,
      message: `Unknown category: ${category}`,
      data: { known: [...KNOWN_CATEGORIES] },
    }
  }
  const limit = parseLimit(args?.limit, MCP_SEARCH_DEFAULT_LIMIT, MCP_SEARCH_MAX_LIMIT)
  if (typeof limit === 'object') {
    return { ok: false, code: INVALID_PARAMS, message: limit.error }
  }
  const offset = args?.offset ?? 0
  if (typeof offset !== 'number' || !Number.isInteger(offset) || offset < 0) {
    return { ok: false, code: INVALID_PARAMS, message: 'offset must be a non-negative integer' }
  }

  const result = queryMcpLogosCatalog({ q: query, category, limit, offset })
  return {
    ok: true,
    payload: {
      count: result.items.length,
      total: result.total,
      hasMore: result.hasMore,
      offset: result.filters.offset,
      datasetVersion: result.datasetVersion,
      items: result.items.map((item) =>
        catalogItemToMcpSummary(deps.siteUrl, item),
      ),
      ui: deps.siteUrl,
    },
  }
}

function getLogo(args: unknown, deps: McpDeps): ToolResult {
  if (!isRecord(args)) {
    return { ok: false, code: INVALID_PARAMS, message: 'arguments must be an object' }
  }
  const slug = typeof args.slug === 'string' ? args.slug : undefined
  const name = typeof args.name === 'string' ? args.name : undefined
  const lookups = [slug, name].filter((value): value is string => Boolean(value?.trim()))
  if (lookups.length === 0) {
    return { ok: false, code: INVALID_PARAMS, message: 'slug or name is required' }
  }

  // Try the slug first, then fall back to the name when both were given.
  let payload = resolveLogoBySlugOrName(deps.siteUrl, lookups[0])
  for (const lookup of lookups.slice(1)) {
    if ((payload as { found?: boolean }).found !== false) break
    payload = resolveLogoBySlugOrName(deps.siteUrl, lookup)
  }
  return { ok: true, payload }
}

function listCategories(_args: unknown, deps: McpDeps): ToolResult {
  const categories = listCategoryMeta().map((row) => ({
    ...row,
    pageUrl: `${deps.siteUrl}${row.pageUrl}`,
  }))
  return {
    ok: true,
    payload: { categories, ui: deps.siteUrl },
  }
}

function listByCategory(args: unknown, deps: McpDeps): ToolResult {
  if (!isRecord(args) || typeof args.category !== 'string' || !args.category.trim()) {
    return { ok: false, code: INVALID_PARAMS, message: 'category is required' }
  }
  const offset =
    typeof args.offset === 'number' && Number.isInteger(args.offset) && args.offset >= 0
      ? args.offset
      : 0
  const limit = parseLimit(args.limit, DEFAULT_CATALOG_LIMIT, MAX_CATALOG_LIMIT)
  if (typeof limit === 'object') {
    return { ok: false, code: INVALID_PARAMS, message: limit.error }
  }

  const categoryId = args.category.trim().toLowerCase()
  if (!KNOWN_CATEGORIES.has(categoryId)) {
    return {
      ok: false,
      code: INVALID_PARAMS,
      message: `Unknown category: ${args.category}`,
      data: { known: [...KNOWN_CATEGORIES] },
    }
  }

  const result = queryLogosCatalog({
    category: categoryId,
    offset,
    limit,
  })

  return {
    ok: true,
    payload: {
      category: result.filters.category,
      count: result.items.length,
      total: result.total,
      hasMore: result.hasMore,
      offset: result.filters.offset,
      items: result.items.map((item) =>
        catalogItemToMcpSummary(deps.siteUrl, item),
      ),
      ui: deps.siteUrl,
    },
  }
}

const EXECUTORS: Record<string, (args: unknown, deps: McpDeps) => ToolResult> = {
  search_logos: searchLogos,
  get_logo: getLogo,
  list_categories: listCategories,
  list_by_category: listByCategory,
}

export function callTool(
  name: string,
  args: unknown,
  deps: McpDeps,
): ToolResult {
  const exec = Object.hasOwn(EXECUTORS, name) ? EXECUTORS[name] : undefined
  if (!exec) {
    return { ok: false, code: INVALID_PARAMS, message: `Unknown tool: ${name}` }
  }
  try {
    const result = exec(args, deps)
    if (result.ok) {
      deps.onToolCall?.(name)
    }
    return result
  } catch (error) {
    return {
      ok: false,
      code: INTERNAL_ERROR,
      message: 'Internal error',
      data: error instanceof Error ? error.message : undefined,
    }
  }
}

export function toolCallResponse(id: JsonRpcId, result: ToolResult): JsonRpcResponse {
  if (!result.ok) {
    return jsonRpcError(id, result.code, result.message, result.data)
  }
  const text = JSON.stringify(result.payload, null, 2)
  return jsonRpcResult(id, {
    content: [{ type: 'text', text }],
    structuredContent: result.payload,
  })
}