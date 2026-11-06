# Logo entity detail

Each financial entity has a detail page with preview, domain link, category, download actions, and Google/DuckDuckGo favicon URLs.

## Sub-features

- `detail-render` — heading and preview image load
- `detail-download` — PNG/SVG download buttons hit `/api/logo-download`
- `detail-related` — related entities section when present

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
- **Automated.** `pnpm verify:loguitos drive` writes `logo-detail-desktop.png`, runs brand-verify slot captures from main (#50), and runs the logo-detail a11y smoke (`logo-detail-a11y.json`: download/copy controls ≥44px tall; Descargar PNG and SVG contrast ≥4.5:1 default and hover in **light and dark** on four slugs at 390px and 1440px widths).
- **Proof.** Screenshot shows entity name and domain link; doctor `logo-banco-provincia-meta` covers head metadata without a separate browser step.

## Gotchas

- Slug collisions append `-<id>`; prefer well-known slugs from `lib/logos-data.ts` for stable recipes
- External favicon images load from Google/DuckDuckGo; offline runs may show broken images while layout still passes
