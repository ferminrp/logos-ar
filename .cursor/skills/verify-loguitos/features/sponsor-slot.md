# Sponsor slot (Fase 2, Opción A)

Monetization slot on `/logo/<slug>` below the intro copy and above the entity preview card. Reserved SSR height avoids CLS when campaigns load or the slot is empty.

## Sub-features

- `sponsor-shell` — `<aside aria-label="Contenido patrocinado">` (or empty reserved shell when disabled) with `min-h-[148px] sm:min-h-[88px]`
- `sponsor-targeting` — `lib/sponsor-slot.ts` picks Lemon affiliate on fintech slugs except competitors; bancos and excluded fintechs get the house “Ver API” promo
- `sponsor-flag` — `PUBLIC_SLOT_SPONSOR=on` at **build** time enables filled asides; `off` renders nothing (no empty placeholder)
- `sponsor-lemon-cta` — Lemon links use `rel="sponsored noopener"` and `target="_blank"`
- `sponsor-cls` — Playwright CLS on capture routes must stay below 0.1

## How to get to it (user POV)

- Open a fintech detail page such as `/logo/nubi` (Lemon when enabled) or `/logo/uala` (house promo, no Lemon copy)
- The patrocinado card sits between the intro paragraph and the large logo preview

## Driving it with verify-loguitos

Preconditions:

- Doctor pass on the same base URL
- `launch` / `all` builds with `PUBLIC_SLOT_SPONSOR=on` (default in the harness unless you override the env var)
- Fintech slug `nubi` exists in the dataset (non-excluded fintech for Lemon)

- **Lemon structure.** Doctor `GET /logo/nubi` expects the sponsor aside, house or Lemon copy, and placement before the large preview (`flex flex-col gap-6 sm:flex-row`). Without `PUBLIC_SPONSOR_LEMON_HREF` at build time, Lemon targeting falls back to the house API promo (no `rel="sponsored"` external CTA).
- **Competitor guard.** Doctor asserts no “Abrí tu cuenta en Lemon” on `/logo/uala` or `/logo/mercado-pago`; BNA shows house ad, not Lemon.
- **Module rules.** Offline `sponsor-slot-module` mirrors `lib/sponsor-slot.test.mts` targeting.
- **Automated drive.** Twelve sponsor aside screenshots on `uala`, `mercado-pago`, `banco-de-la-nacion-argentina` (390/1440 × light/dark, default + CTA focus) plus `sponsor-slot-metrics.json` (CLS cap 0.1).

## Gotchas

- Slot content is fixed at Astro build via `import.meta.env.PUBLIC_SLOT_SPONSOR`; changing the flag requires a rebuild, not only restarting `wrangler dev`.
- Brand verify (Opción B) is a separate aside below downloads; do not confuse it with the sponsor slot.
- Production-only `www`/`http` canonical redirects live in `lib/worker-canonical-redirect.ts`; localhost doctor cannot hit `loguitos.app` hostnames (see `seo-ctr.md` `worker-canonical-redirect`).