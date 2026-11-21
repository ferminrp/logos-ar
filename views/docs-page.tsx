import { DocsCopyMarkdownButton } from "@/components/docs-copy-markdown-button"
import {
  API_DOCS_BASE_API,
  API_DOCS_CACHE_ITEMS,
  API_DOCS_EXAMPLES,
  API_DOCS_DOWNLOAD_NOTE,
  API_DOCS_FIELD_NOTES,
  API_DOCS_INTRO,
  API_DOCS_QUERY_PARAMS,
  API_DOCS_RESPONSE_EXAMPLE,
  API_DOCS_RESPONSE_NOTE,
} from "@/lib/api-docs-content"
import {
  MCP_CLIENT_STEPS,
  MCP_DOCS_INTRO,
  MCP_ENDPOINT_PATH,
  getMcpEndpointUrl,
} from "@/lib/mcp-docs-content"
import { TOOL_DEFINITIONS } from "@/lib/mcp/tools"

/** Renders `backtick` spans of a plain docs string as <code>. */
function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, index) =>
        index % 2 === 1 ? <code key={index}>{part}</code> : part,
      )}
    </>
  )
}

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">API de logos</h1>
      <p className="mt-3 text-muted-foreground">{API_DOCS_INTRO}</p>
      <div className="mt-4">
        <DocsCopyMarkdownButton />
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">Endpoint</h2>
        <p className="text-sm text-muted-foreground">
          <code>GET {API_DOCS_BASE_API}</code>
        </p>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">Query params</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          {API_DOCS_QUERY_PARAMS.map((item) => (
            <li key={item.param}>
              <code>{item.param}</code>:{" "}
              {"inlineCodes" in item ? (
                <>
                  {item.description}
                  {item.inlineCodes.map((code, index) => (
                    <span key={code}>
                      {index > 0 ? ", " : null}
                      <code>{code}</code>
                    </span>
                  ))}
                  {item.descriptionSuffix}
                </>
              ) : (
                item.description
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">Ejemplos</h2>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{API_DOCS_EXAMPLES}</pre>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">Respuesta</h2>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{API_DOCS_RESPONSE_EXAMPLE}</pre>
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          {API_DOCS_FIELD_NOTES.map((note) => (
            <li key={note}>
              <InlineCode text={note} />
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          {API_DOCS_RESPONSE_NOTE.before}
          <code>{API_DOCS_RESPONSE_NOTE.header}</code>
          {API_DOCS_RESPONSE_NOTE.after}
        </p>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">
          Descarga de un logo
        </h2>
        <p className="text-sm text-muted-foreground">
          <InlineCode text={API_DOCS_DOWNLOAD_NOTE} />
        </p>
      </section>

      <section id="mcp" className="mt-10 space-y-3 scroll-mt-24">
        <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">MCP público</h2>
        <p className="text-sm text-muted-foreground">{MCP_DOCS_INTRO}</p>
        <p className="text-sm text-muted-foreground">
          Endpoint: <code>{getMcpEndpointUrl()}</code> (alias <code>{MCP_ENDPOINT_PATH}</code> y{" "}
          <code>/api/mcp</code>). Discovery: <code>/.well-known/mcp.json</code> y{" "}
          <code>/.well-known/mcp</code>.
        </p>
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          {TOOL_DEFINITIONS.map((tool) => (
            <li key={tool.name}>
              <code>{tool.name}</code>: {tool.description}
            </li>
          ))}
        </ul>
        <ul className="mt-4 list-disc space-y-4 pl-6 text-sm text-muted-foreground">
          {MCP_CLIENT_STEPS.map((client) => (
            <li key={client.name}>
              <span className="font-medium text-foreground">{client.name}</span>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                {client.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="font-serif text-xl font-medium tracking-tight text-foreground">Cache</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          {API_DOCS_CACHE_ITEMS.map((item) => (
            <li key={"text" in item ? item.text : item.prefix}>
              {"inlineCodes" in item ? (
                <>
                  {item.prefix}
                  {item.inlineCodes.map((code, index) => (
                    <span key={code}>
                      {index > 0 ? ", " : null}
                      <code>{code}</code>
                    </span>
                  ))}
                  {item.suffix}
                </>
              ) : (
                item.text
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
