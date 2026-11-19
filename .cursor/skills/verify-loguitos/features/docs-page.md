# API docs page

Static documentation for the logos API, query parameters, and examples.

## Sub-features

- `docs-render` — title and endpoint section visible
- `docs-copy` — copy-as-markdown control present
- `docs-mcp` — MCP público section with tool list and discovery URLs

## How to get to it (user POV)

- Footer or nav link to `/docs`
- Direct URL `/docs`

## Driving it with verify-loguitos

Preconditions:

- Doctor pass (`GET /docs` → 200)

- **Load page.** Navigate to `/docs`. Visible heading `API de logos` and text `GET /api/logos`.
- **MCP section.** Same page shows heading `MCP público`, endpoint `/mcp`, discovery `/.well-known/mcp.json`, and tool name `search_logos` (see `lib/mcp-docs-content.ts` and `views/docs-page.tsx`).
- **Proof.** Doctor records `/docs` status; optional manual screenshot if docs layout changed.

## Gotchas

- Docs content is sourced from `lib/api-docs-content.ts`; copy changes require updating this feature file
