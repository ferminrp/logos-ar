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

- **Bancos hub.** `GET /categoria/bancos` returns 200 HTML containing `Banco Galicia` or category title for banks.
- **Proof.** HTTP 200 plus known entity name in HTML (manual curl or browser).

## Gotchas

- Category ids must match `lib/logos-data.ts` (`bancos`, not localized slug text)
- Flags use `/categoria/banderas` instead of a generic category id
