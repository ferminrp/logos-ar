export const API_DOCS_BASE_API = "/api/logos"

export const API_DOCS_INTRO =
  "Endpoint para consultar logos por nombre, dominio y categoría opcional."

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
  { param: "q", description: "texto libre para buscar por nombre o dominio." },
  { param: "domain", description: "filtro parcial por dominio." },
  {
    param: "category",
    description: "categoría opcional (ej: ",
    inlineCodes: ["bancos", "fintechs"],
    descriptionSuffix: ").",
  },
  { param: "limit", description: "cantidad máxima por página (default: 50, max: 200)." },
  { param: "offset", description: "desplazamiento para paginación (default: 0)." },
]

export const API_DOCS_EXAMPLES = `GET /api/logos
GET /api/logos?category=fintechs
GET /api/logos?q=galicia
GET /api/logos?domain=com.ar&limit=20&offset=0
GET /api/logos?category=bancos&q=banco`

export const API_DOCS_RESPONSE_EXAMPLE = `{
  "datasetVersion": "7f2bce765b13",
  "items": [
    {
      "name": "Banco de la Nación Argentina",
      "domain": "bna.com.ar",
      "google_domain": "https://s2.googleusercontent.com/s2/favicons?domain=bna.com.ar&sz=128",
      "duck_domain": "https://icons.duckduckgo.com/ip3/bna.com.ar.ico",
      "categoryId": "bancos",
      "categoryName": "Bancos"
    }
  ],
  "total": 1,
  "hasMore": false,
  "filters": {
    "q": "nacion",
    "domain": null,
    "category": "bancos",
    "limit": 50,
    "offset": 0
  }
}`

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
  { text: "Sin filtros: cache agresiva de CDN para minimizar cómputo." },
  {
    prefix: "Con filtros (",
    inlineCodes: ["q", "domain", "category"],
    suffix: " válida): cache de 24h con stale-while-revalidate.",
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

${API_DOCS_RESPONSE_NOTE.before}\`${API_DOCS_RESPONSE_NOTE.header}\`${API_DOCS_RESPONSE_NOTE.after}

## Cache

${API_DOCS_CACHE_ITEMS.map(formatCacheItemMarkdown).join("\n")}
`
