# Hosted logos (R2 + static fallback)

Catalog artwork at `/logos/<slug>.png|svg` and brand isotipos at `/logos/<slug>/isotipo.svg`. Production serves from the `LOGOS` R2 binding (`loguitos-assets`) with `ASSETS` fallback (`public/logos/`, `public/isotipos/` staged in `prebuild`). Download API responses reuse the same security headers (`lib/logo-image-security-headers.ts`).

## Sub-features

- `hosted-paths` — PNG/SVG tiles under `/logos/<slug>.{png,svg}`; isotipos at `/logos/<slug>/isotipo.svg` (`lib/hosted-logos-path.ts`, `lib/isotipos-catalog.ts`)
- `r2-assets-fallback` — Worker tries R2, then static assets (`lib/worker-logos-r2.ts`); local `verify:loguitos launch` exercises the ASSETS path after `pnpm build`
- `logo-image-security` — `X-Content-Type-Options: nosniff` on PNG; SVG and isotipo responses also ship sandbox CSP (`default-src 'none'; style-src 'unsafe-inline'; sandbox`)
- `dedupe-redirects` — Retired slug and hosted paths 301 to canonical rows (`data/permanent-redirects.json`, including `/logos/<alias>/…` and `/logos/<alias>/isotipo.svg`)

## How to get to it (user POV)

- Home and category grids load self-hosted `/logos/*.png` thumbnails
- On a brand with an isotipo (for example Mercado Pago), open `/logo/mercado-pago` and use **Descargar isotipo SVG** or copy the hosted URL
- Old bookmarks such as `/logo/bbva` or `/logos/galicia.png` redirect to the canonical slug paths

## Driving it with verify-loguitos

Preconditions:

- `pnpm verify:loguitos launch` or `all` so `prebuild` staged `public/isotipos/` and Worker routing is active
- Doctor pass

- **Hosted PNG.** `GET /logos/mercado-pago.png` → 200, `image/png`, `X-Content-Type-Options: nosniff`.
- **Hosted SVG.** `GET /logos/mercado-pago.svg` → 200, `image/svg+xml`, nosniff + sandbox CSP.
- **Isotipo.** `GET /logos/mercado-pago/isotipo.svg` → 200 with the same SVG security headers.
- **Dedupe redirect.** `GET /logo/bbva` and `GET /logos/galicia/isotipo.svg` with `redirect: manual` → 301/308 to canonical `bbva-argentina` / `banco-galicia` paths.
- **Entity UI.** `GET /logo/mercado-pago` includes isotipo download copy when the slug is in `data/isotipos/metadata.json`.
- **REST field.** `GET /api/logos?q=mercado+pago&limit=3` includes `isotipoSvgUrl` for the `mercado-pago` item.
- **MCP parity.** `get_logo` with `slug: mercado-pago` includes `isotipoSvgUrl` and `svgIsVector`; `get_logo` with alias `bbva` resolves to `bbva-argentina`.
- **Download API.** `GET /api/logo-download?domain=mercadopago.com.ar&format=svg&size=256` returns SVG with nosniff + CSP (same module as hosted static SVG).
- **Automated.** Doctor checks listed above; `drive` logs `home catalog tiles use self-hosted /logos/ assets` when grid images load.

## Gotchas

- R2 objects are optional locally; doctor uses slugs with files under `public/logos/` and staged isotipos
- `svgIsVector` distinguishes real hosted SVG vectors from PNG-derived SVG wrappers (`lib/logo-assets.ts`)
- Logo-quality (`pnpm check:logos`) is separate; this feature covers Worker routing and headers only