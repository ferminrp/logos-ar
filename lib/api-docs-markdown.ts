export const API_DOCS_MARKDOWN = `# API de logos

Endpoint para consultar logos por nombre, dominio y categoría opcional.

## Endpoint

\`GET /api/logos\`

## Query params

- \`q\`: texto libre para buscar por nombre o dominio.
- \`domain\`: filtro parcial por dominio.
- \`category\`: categoría opcional (ej: \`bancos\`, \`fintechs\`).
- \`limit\`: cantidad máxima por página (default: 50, max: 200).
- \`offset\`: desplazamiento para paginación (default: 0).

## Ejemplos

\`\`\`
GET /api/logos
GET /api/logos?category=fintechs
GET /api/logos?q=galicia
GET /api/logos?domain=com.ar&limit=20&offset=0
GET /api/logos?category=bancos&q=banco
\`\`\`

## Respuesta

\`\`\`json
{
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
}
\`\`\`

También se incluye el header \`X-Logos-Dataset-Version\` para facilitar debugging de cache/CDN.

## Cache

- Sin filtros: cache agresiva de CDN para minimizar cómputo.
- Con filtros (\`q\`, \`domain\`, \`category\` válida): cache de 24h con stale-while-revalidate.
`
