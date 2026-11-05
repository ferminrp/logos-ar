# Brand verify slot (Opción B)

Monetization house ad on entity pages inviting brand teams to submit an official SVG for verification.

## Sub-features

- `verify-render` — `<aside aria-label="Para equipos de marca">` with dynamic `{Marca}` copy
- `verify-mailto` — CTA links to `mailto:marcas@loguitos.app` with encoded subject
- `verify-placement` — slot sits after Google Sheets and before the disclaimer paragraph
- `verify-cls` — SSR `min-h-[132px]` / `sm:min-h-[72px]` on the aside shell

## How to get to it (user POV)

- Open any entity detail page, for example `/logo/uala` or `/logo/banco-de-la-nacion-argentina`
- Scroll past favicon URLs, curl blocks, and Google Sheets
- The dashed card appears above “Los favicons se obtienen…”

## Driving it with verify-loguitos

Preconditions:

- Doctor pass on the same base URL
- `NEXT_PUBLIC_SLOT_VERIFY` is not `off` (default enabled)

- **Direct route.** `/logo/uala` shows “¿Trabajás en Ualá?” and CTA “Pedí tu logo verificado”.
- **Automated doctor.** Checks BNA placement/min-height and Ualá mailto encoding (`brand-verify-slot-*` checks).
- **Automated drive.** Eight aside screenshots: `brand-verify-{slug}-{390|1440}-{light|dark}.png` for slugs `uala` and `banco-de-la-nacion-argentina`.

## Gotchas

- Disable the slot only with `NEXT_PUBLIC_SLOT_VERIFY=off` at build time; do not conditionally collapse the aside in SSR without the flag.
- Dark mode screenshots add `class="dark"` on `<html>` because Playwright runs without system theme.
