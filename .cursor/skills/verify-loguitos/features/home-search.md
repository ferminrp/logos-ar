# Home search

Users filter the catalog from the home page by name, domain, or flag code. Results update via the `q` query parameter.

## Sub-features

- `search-mobile` — submit search from the mobile form below the header
- `search-desktop` — submit search from the navbar form on large screens
- `search-url` — load `/?q=<term>` directly
- `search-empty` — query with no matches shows an empty state

## How to get to it (user POV)

- Open `/`
- Type in **Buscar por nombre, dominio o código...** and submit
- Or follow a link to `/?q=galicia`

## Driving it with verify-loguitos

Preconditions:

- `pnpm verify:loguitos doctor` exits 0
- Base URL is set (launched instance or `VERIFY_LOGUITOS_BASE_URL`)

- **URL entry.** Open `/?q=galicia`. Expect copy `Resultados para "galicia"` and at least one card mentioning Galicia.
- **Mobile results.** Viewport 390×844, open `/?q=galicia` (or submit from the `main` search form; the navbar duplicates the placeholder on small viewports). Expect `Resultados para "galicia"`.
- **Automated.** `pnpm verify:loguitos drive` loads `/?q=galicia` on mobile and captures `home-search-mobile.png` plus desktop home shots.
- **Proof.** `home-search-mobile.png` shows the query and results; `doctor.json` includes API corroboration for `galicia`.

## Gotchas

- Desktop search lives in the navbar (`lg:` breakpoint); below 1024px use the home form or direct URL
- Search is case-insensitive on name and domain
- Empty queries redirect to `/` without `q`
