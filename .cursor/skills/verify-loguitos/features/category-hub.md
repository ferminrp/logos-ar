# Category hub

Browse entities grouped by category (for example all banks).

## Sub-features

- `hub-list` — category page lists entities for that category
- `hub-nav` — category chips on home link to `/categoria/<id>`

## How to get to it (user POV)

- From home, tap a category chip (mobile) or use category navigation
- Open `/categoria/bancos` directly

## Driving it with verify-loguitos

Preconditions:

- Doctor pass

- **Bancos hub.** `GET /categoria/bancos` returns 200 with H1 `Logos de bancos argentinos` (see `lib/category-seo.ts`) and entity cards such as `Banco Galicia` in the grid.
- **Proof.** HTTP 200 plus SEO H1 and a known entity name (manual curl or `category-bancos-seo-desktop.png` from `drive`).

## Gotchas

- Category ids must match `lib/logos-data.ts` (`bancos`, not localized slug text)
- Flags use `/categoria/banderas` instead of a generic category id
