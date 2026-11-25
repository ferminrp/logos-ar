# Logos API

Public read-only JSON at `/api/logos` with query, category, domain, and pagination filters.

## Sub-features

- `api-search` — `q` parameter filters by name or domain
- `api-category` — `category` limits to a known category id
- `api-pagination` — `limit` and `offset` slice results

## How to get to it (user POV)

- Documented at `/docs`
- Called as `GET /api/logos?...` from any HTTP client

## Driving it with verify-loguitos

Preconditions:

- Server running and doctor pass

- **Search.** `GET /api/logos?q=galicia&limit=5` returns 200, JSON with `items` length ≥ 1, and `total` ≥ 1.
- **Isotipo field.** Items for brands with a catalog isotipo expose `isotipoSvgUrl` pointing at `/logos/<slug>/isotipo.svg` (doctor asserts on `mercado-pago` and batch-3 `personal-pay`).
- **GSC alias.** `GET /api/logos?q=meli&limit=5` matches Mercado Libre via dataset `searchText` (also covers typo-style queries such as `porche` → Porsche when present in `searchText`).
- **Category.** `GET /api/logos?category=bancos&limit=3` returns only `categoryId` bancos when category is valid.
- **Automated.** Included in `pnpm verify:loguitos doctor` (galicia search assertion).
- **Proof.** `doctor.json` stores status codes and parsed checks.

## Gotchas

- Filtering and pagination for REST and MCP share `lib/logos-catalog.ts`; MCP tool calls must stay aligned with `/api/logos` query semantics
- Unknown `category` values are ignored for filtering (see route implementation); use ids from docs, including batch-1014 additions such as `telecomunicaciones`, `obras-sociales`, `sanatorios`, `alimentos`, `combustibles`, `seguros`, `indumentaria`, `turismo`, `energia`, and `indie-projects`, plus `bancos`, `fintechs`, `crypto`, `tecnologias`, `prepagas`, `banderas`, `retail`, `medios`, `automotrices`, `gastronomia`, `alycs`, `acciones`, `entes-estatales`
- `datasetVersion` changes when datasets regenerate on build
