import {
  MCP_DOCS_INTRO,
  MCP_ENDPOINT_PATH,
  formatToolListMarkdown,
} from "./mcp-docs-content.ts"

export const API_DOCS_BASE_API = "/api/logos"

export const API_DOCS_INTRO =
  "Endpoint público (sin autenticación, con CORS abierto) para consultar logos por nombre, dominio y categoría. Incluye banderas con URL SVG."

type QueryParam =
  | {
      param: string
      description: string
    }
  | {
      param: string
      description: string
      inlineCodes: readonly string[]
      descriptionSuffix: string
    }

export const API_DOCS_QUERY_PARAMS: readonly QueryParam[] = [
  { param: "q", description: "texto libre para buscar por nombre o dominio. Ignora acentos y mayúsculas; cada palabra tiene que aparecer." },
  { param: "domain", description: "filtro parcial por dominio." },
  {
    param: "category",
    description: "categoría opcional (ej: ",
    inlineCodes: ["bancos", "fintechs", "crypto", "tecnologias", "prepagas", "banderas"],
    descriptionSuffix: "). Una categoría desconocida devuelve 400 con la lista de categorías válidas.",
  },
  { param: "limit", description: "cantidad máxima por página (default: 50, max: 200)." },
  { param: "offset", description: "desplazamiento para paginación (default: 0)." },
]

export const API_DOCS_EXAMPLES = `GET /api/logos
GET /api/logos?category=fintechs
GET /api/logos?category=crypto
GET /api/logos?category=tecnologias
GET /api/logos?category=prepagas
GET /api/logos?category=banderas
GET /api/logos?q=galicia
GET /api/logos?q=argentina&category=banderas
GET /api/logos?domain=com.ar&limit=20&offset=0
GET /api/logos?category=bancos&q=banco`

export const API_DOCS_RESPONSE_EXAMPLE = `{
  "items": [
    {
      "name": "Banco de la Nación Argentina",
      "domain": "bna.com.ar",
      "slug": "banco-de-la-nacion-argentina",
      "pageUrl": "https://loguitos.app/logo/banco-de-la-nacion-argentina",
      "catalog_logo_url": "https://loguitos.app/logos/banco-de-la-nacion-argentina.png",
      "logo_source": "hosted",
      "isotipoSvgUrl": "https://loguitos.app/logos/banco-de-la-nacion-argentina/isotipo.svg",
      "google_domain": "https://s2.googleusercontent.com/s2/favicons?domain=bna.com.ar&sz=128",
      "duck_domain": "https://icons.duckduckgo.com/ip3/bna.com.ar.ico",
      "categoryId": "bancos",
      "categoryName": "Bancos"
    }
  ],
  "total": 1,
  "hasMore": false,
  "datasetVersion": "ae47a81b3b84:baac132bd986",
  "filters": {
    "q": "nacion",
    "domain": null,
    "category": "bancos",
    "limit": 50,
    "offset": 0
  }
}`

export const API_DOCS_FIELD_NOTES: readonly string[] = [
  "`catalog_logo_url`: el logo que muestra el catálogo. Si `logo_source` es `hosted` es un PNG propio en `/logos/<slug>.png`; si es `google` es un favicon remoto.",
  "`isotipoSvgUrl`: solo aparece cuando la marca tiene isotipo vectorial.",
  "Las banderas (`category=banderas`) tienen otra forma: `code`, `name`, `svgUrl`, `categoryId` y `categoryName`.",
  "`datasetVersion` combina la versión de logos y la de banderas; cambia cuando cambia el catálogo.",
]

export const API_DOCS_DOWNLOAD_NOTE =
  "Descarga directa: `GET /api/logo-download?domain=<dominio>&format=png|svg|isotipo`. `format=svg` devuelve un vector real solo cuando el catálogo lo tiene; si no, es el PNG embebido en un SVG. `size` (hasta 256) aplica a los favicons remotos; los PNG propios se sirven a 256 px."

export const API_DOCS_RESPONSE_NOTE = {
  before: "También se incluye el header ",
  header: "X-Logos-Dataset-Version",
  after: " para facilitar debugging de cache/CDN.",
}

type CacheItem =
  | {
      text: string
    }
  | {
      prefix: string
      inlineCodes: readonly string[]
      suffix: string
    }

export const API_DOCS_CACHE_ITEMS: readonly CacheItem[] = [
  {
    text: "Con o sin filtros: cache de CDN de 24h con stale-while-revalidate de 7 días.",
  },
]

function formatQueryParamMarkdown(item: QueryParam) {
  if ("inlineCodes" in item) {
    const examples = item.inlineCodes.map((code) => `\`${code}\``).join(", ")
    return `- \`${item.param}\`: ${item.description}${examples}${item.descriptionSuffix}`
  }

  return `- \`${item.param}\`: ${item.description}`
}

function formatCacheItemMarkdown(item: CacheItem) {
  if ("inlineCodes" in item) {
    const codes = item.inlineCodes.map((code) => `\`${code}\``).join(", ")
    return `- ${item.prefix}${codes}${item.suffix}`
  }

  return `- ${item.text}`
}

export const API_DOCS_MARKDOWN = `# API de logos

${API_DOCS_INTRO}

## Endpoint

\`GET ${API_DOCS_BASE_API}\`

## Query params

${API_DOCS_QUERY_PARAMS.map(formatQueryParamMarkdown).join("\n")}

## Ejemplos

\`\`\`
${API_DOCS_EXAMPLES}
\`\`\`

## Respuesta

\`\`\`json
${API_DOCS_RESPONSE_EXAMPLE}
\`\`\`

${API_DOCS_FIELD_NOTES.map((note) => `- ${note}`).join("\n")}

${API_DOCS_RESPONSE_NOTE.before}\`${API_DOCS_RESPONSE_NOTE.header}\`${API_DOCS_RESPONSE_NOTE.after}

## Descarga de un logo

${API_DOCS_DOWNLOAD_NOTE}

## MCP público

${MCP_DOCS_INTRO}

Endpoint: \`${MCP_ENDPOINT_PATH}\` (alias \`/api/mcp\`). Discovery: \`/.well-known/mcp.json\`.

${formatToolListMarkdown()}

## Cache

${API_DOCS_CACHE_ITEMS.map(formatCacheItemMarkdown).join("\n")}
`
