export default function DocsPage() {
  const baseApi = "/api/logos"

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">API de logos</h1>
      <p className="mt-3 text-muted-foreground">
        Endpoint para consultar logos por nombre, dominio y categoría opcional.
      </p>

      <section className="mt-8 space-y-3 rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-semibold text-foreground">Endpoint</h2>
        <p className="text-sm text-muted-foreground">
          <code>GET {baseApi}</code>
        </p>
      </section>

      <section className="mt-6 space-y-3 rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-semibold text-foreground">Query params</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li>
            <code>q</code>: texto libre para buscar por nombre o dominio.
          </li>
          <li>
            <code>domain</code>: filtro parcial por dominio.
          </li>
          <li>
            <code>category</code>: categoría opcional (ej: <code>bancos</code>, <code>fintechs</code>).
          </li>
          <li>
            <code>limit</code>: cantidad máxima por página (default: 50, max: 200).
          </li>
          <li>
            <code>offset</code>: desplazamiento para paginación (default: 0).
          </li>
        </ul>
      </section>

      <section className="mt-6 space-y-3 rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-semibold text-foreground">Ejemplos</h2>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`GET /api/logos
GET /api/logos?category=fintechs
GET /api/logos?q=galicia
GET /api/logos?domain=com.ar&limit=20&offset=0
GET /api/logos?category=bancos&q=banco`}
        </pre>
      </section>

      <section className="mt-6 space-y-3 rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-semibold text-foreground">Respuesta</h2>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`{
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
}`}
        </pre>
      </section>

    </main>
  )
}
