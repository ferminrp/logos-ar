# Logo entity detail

Each financial entity has a detail page with preview, domain link, category, download actions, and Google/DuckDuckGo favicon URLs.

## Sub-features

- `detail-render` — heading and preview image load
- `detail-download` — PNG/SVG download buttons hit `/api/logo-download` (Workers WASM pipeline; doctor probes hosted, upstream fallback, and large-size PNG)
- `detail-related` — related entities section when present
- `detail-a11y` — download and copy controls meet 44px touch height and WCAG 4.5:1 contrast on PNG/SVG primaries (light and dark, default and hover); exercised in `drive` via `scripts/logo-detail-a11y-smoke.mts`
- `detail-analytics` — `logo_download` GA4 via `window.gtag` after PNG/SVG clicks (`components/logo-download-buttons.tsx`; `drive` wraps `gtag` and writes `logo-download-analytics.json`)

## How to get to it (user POV)

- Click an entity card from home or a category page
- Or open `/logo/<slug>` directly (example: `/logo/banco-galicia`)

## Driving it with verify-loguitos

Preconditions:

- Doctor pass on the same base URL
- Slug `banco-galicia` exists in the dataset (Banco Galicia)

- **Direct route.** Navigate to `/logo/banco-galicia`. Heading contains `Logo Banco Galicia` and domain `www.galicia.ar`.
- **Metadata.** View source or doctor check on `/logo/banco-provincia`: `<title>` from `lib/entity-seo.ts` ends with `| Loguitos`, stays within `MAX_ENTITY_TITLE_LENGTH` (60), and never uses `…` mid-word. Meta description includes alias clause when `seoAliases` exist (for example Bapro on Banco Provincia).
- **Long name budget.** Doctor loads `/logo/banco-de-la-nacion-argentina` to guard word-boundary shortening and CTR copy in `<title>` (`BNA`, `Banco Nación`, `PNG y SVG`, `gratis` within 60 characters).
- **Logo download API.** Doctor calls `GET /api/logo-download?format=png` for `www.galicia.ar` (128), `ripio.com` (512), `mercadolibre.com.ar` (256), hosted override `naranjax.com`, and `bbva.com.ar` (upstream fallback). Expect 200 with `image/png`, or wasm-budget passthrough as `image/jpeg` / `image/webp` when conversion is skipped.
- **Automated.** `pnpm verify:loguitos drive` writes `logo-detail-desktop.png`, runs logo-detail a11y smoke (four slugs), and asserts a `logo_download` `gtag` event on `/logo/mercado-pago`.
- **Proof.** Screenshot shows entity name and domain link; `logo-detail-a11y.json` and PNG captures cover touch/contrast; `logo-download-analytics.json` records `logo_slug`, `logo_name`, and `format`; doctor `logo-banco-provincia-meta` and `logo-download-*` rows cover metadata and download API without a separate browser step.

## Gotchas

- Slug collisions append `-<id>`; prefer well-known slugs from `lib/logos-data.ts` for stable recipes
- External favicon images load from Google/DuckDuckGo; offline runs may show broken images while layout still passes
- PNG conversion can return the original raster when WASM budget or upstream fallbacks exhaust (`format=png` only; SVG download is not subject to the raster budget)
