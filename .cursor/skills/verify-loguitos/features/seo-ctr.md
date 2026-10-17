# SEO / CTR surfaces

Category landing copy, entity page metadata, legacy slug recovery, and permanent redirects shipped with `lib/category-seo.ts`, `lib/entity-seo.ts`, and `data/permanent-redirects.json` (wired in `next.config.mjs` via `scripts/generate-permanent-redirects.mts`).

## Sub-features

- `category-seo-landings` — curated H1, intro lead, and meta for selected categories (`bancos`, `prepagas`, `automotrices`, `retail`, `gastronomia`)
- `entity-metadata` — data-driven `<title>`, meta description, and preview image `alt` on `/logo/[slug]`
- `permanent-redirects` — 301/308 recovery for renamed entity slugs and `/categoria/delivery` → `/categoria/gastronomia`

## How to get to it (user POV)

- Open a curated category such as `/categoria/bancos` and read the SEO heading and intro paragraph above the grid
- Open an entity with search aliases (for example `/logo/banco-provincia`) and view page source or tab title for CTR-oriented copy
- Follow an old bookmark such as `/categoria/delivery` or `/logo/tn-todo-noticias` and land on the canonical URL

## Driving it with verify-loguitos

Preconditions:

- Doctor pass (includes SEO and redirect checks below)
- Production build (`launch` or `all`) so `next.config.mjs` redirects are active

- **Category landing.** `GET /categoria/bancos` includes visible H1 `Logos de bancos argentinos` and intro lead mentioning bancos tradicionales, públicos y digitales.
- **Entity metadata.** `GET /logo/banco-provincia` HTML includes meta description starting with `Descargá el logo de Banco Provincia` and document title suffix `| Loguitos`.
- **Redirects (manual redirect).** `GET /categoria/delivery` with `redirect: manual` → 301 or 308 with `Location` ending in `/categoria/gastronomia`. Same pattern for `/logo/banco-provincia-bs-as` → `/logo/banco-provincia` and `/logo/tn-todo-noticias` → `/logo/tn` per `data/permanent-redirects.json`.
- **Automated.** `pnpm verify:loguitos drive` writes `category-bancos-seo-desktop.png` after the logo detail shot.
- **Proof.** `doctor.json` lists `category-bancos-seo`, `logo-banco-provincia-meta`, and the three `redirect-*` checks; screenshot shows the bancos H1.

## Gotchas

- Redirect rules exist only in the production server (`next start` / `pnpm build`); `pnpm dev` may not mirror every permanent redirect
- Categories without overrides still use the generic template from `getCategorySeoCopy` — only the five curated ids have custom H1/title copy
- Entity visible H1 stays `Logo {name}`; SEO title aliases live in `<title>` / Open Graph, not the on-page heading
