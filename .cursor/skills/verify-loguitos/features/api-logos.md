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
- **Category.** `GET /api/logos?category=bancos&limit=3` returns only `categoryId` bancos when category is valid.
- **Automated.** Included in `pnpm verify:loguitos doctor` (galicia search assertion).
- **Proof.** `doctor.json` stores status codes and parsed checks.

## Gotchas

- Unknown `category` values are ignored for filtering (see route implementation); use ids from docs: `bancos`, `fintechs`, `crypto`, `tecnologias`, `prepagas`, `banderas`
- `datasetVersion` changes when datasets regenerate on build
