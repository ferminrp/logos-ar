# Public MCP catalog

Streamable HTTP JSON-RPC at `/mcp` (alias `/api/mcp`) for agents: same dataset filters as `GET /api/logos`, with tool calls for search, single logo, categories, and category listings.

## Sub-features

- `mcp-discovery` — `GET /llms.txt`, `GET /.well-known/mcp.json`, `GET /.well-known/mcp`
- `mcp-jsonrpc` — POST `initialize`, `tools/list`, `tools/call` on `/mcp`
- `mcp-docs` — `/docs#mcp` documents endpoint, tools, and discovery URLs

## How to get to it (user POV)

- Agents connect to `POST /mcp` with JSON-RPC 2.0 on the site origin (no API key)
- Humans read tool names and wiring at `/docs` (section **MCP público**)
- `GET /llms.txt` links the MCP endpoint and well-known discovery paths

## Driving it with verify-loguitos

Preconditions:

- Disposable instance: `pnpm verify:loguitos launch` (or `all`)
- Doctor pass includes MCP discovery and JSON-RPC smoke (`search_logos`, `get_logo`, `list_categories`, `list_by_category`)

- **Discovery.** `GET /llms.txt` → 200 and mentions `/mcp` and `search_logos`. `GET /.well-known/mcp.json` and `GET /.well-known/mcp` → 200 JSON descriptors.
- **Initialize.** `POST /mcp` with `method: initialize` returns a `result` containing `protocolVersion`.
- **Tools.** `tools/list` includes `search_logos`, `get_logo`, `list_categories`, `list_by_category`.
- **Calls.** `search_logos` with `query: galicia` returns galicia in the payload; `get_logo` with `slug: banco-galicia` includes `/api/logo-download` URLs; `get_logo` with `slug: mercado-pago` includes `isotipoSvgUrl` (when catalog isotipo exists) and boolean `svgIsVector`; `get_logo` with retired alias `bbva` resolves to `bbva-argentina`; `list_categories` mentions `bancos`; `list_by_category` with `category: bancos` returns `categoryId`.
- **REST parity.** `GET /api/logos?q=galicia&limit=1` still returns an `items` array (shared `lib/logos-catalog.ts`).
- **Docs.** `GET /docs` includes heading **MCP público** and tool name `search_logos`.
- **Optional bash parity.** `bash scripts/smoke-mcp.sh "$VERIFY_LOGUITOS_BASE_URL"` mirrors the RPC sequence against any running base URL.

## Gotchas

- Local runs without `GA4_API_SECRET` still succeed; server-side `mcp_tool_call` GA4 posts are skipped when the secret is unset
- `GET /mcp` with `Accept: text/html` redirects browsers to `/docs#mcp`; doctor uses JSON-RPC POST only
- MCP search limits default to 25 and cap at 100 (`MCP_SEARCH_MAX_LIMIT`), stricter than the REST default when callers omit `limit`