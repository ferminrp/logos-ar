# Animation plans — logos-ar

Recon stamp: `4b97e8b`. Plans written from a `find-animation-opportunities`
sweep; each is a self-contained spec for `improve-animations execute <plan>` or
any other agent. Feel was judged from code only — nothing was rendered.

## Recon

| Fact | Detail |
| --- | --- |
| **Stack** | Astro + React islands (`client:load`), Tailwind CSS v4, shadcn/ui (Radix), on Cloudflare Workers |
| **Motion libs** | `tw-animate-css` 1.4.0 only (`src/styles/globals.css:2`). No Motion / GSAP / springs. `vaul`, `sonner`, `cmdk`, `embla` are installed but never mounted |
| **Tokens** | None before this work. Plan 001 adds `--motion-ease-out`, `--motion-ease-in-out`, `--motion-ease-drawer`, `--motion-duration-fast` (150ms), `--motion-duration-press` (160ms), `--motion-duration-normal` (200ms) in `:root` |
| **Reduced motion** | Not handled before this work. Plan 001 adds the policy: keep opacity and colour, drop travel |
| **Personality** | Calm, warm editorial utility catalog: short durations, strong ease-out, no bounce |
| **Navigation** | Full document loads (`lib/client-navigation.ts:49`); no view transitions, by design |
| **Tens/day** | Copy and download buttons |
| **Occasional** | Mobile menu sheet, FAQ accordion, flag deep-links |
| **Rare** | Download error, 404 |
| **Already animating** | FAQ accordion height (`components/ui/accordion.tsx:58`), mobile sheet slide + overlay fade (`components/ui/sheet.tsx:39`, `:61`), hover colour transitions |
| **Live `components/ui/`** | Only `button`, `input`, `sheet`, `collapsible`, `accordion`. The rest is unused scaffolding and out of scope |

## Plans

| # | Title | Severity | Status | Depends on |
| --- | --- | --- | --- | --- |
| [001](001-motion-tokens-and-reduced-motion.md) | Add motion tokens and a reduced-motion policy | MEDIUM | DONE | — |
| [002](002-button-press-feedback.md) | Button: press feedback and scoped transition | HIGH | TODO | 001 |
| [003](003-copy-check-icon-enter.md) | Copy buttons: ease the success check in | MEDIUM | TODO | 001 |
| [004](004-flag-deep-link-target-marker.md) | Banderas: mark the deep-linked flag card | MEDIUM | TODO | 001 |
| [005](005-download-error-enter.md) | Logo download: ease the error message in | LOW | TODO | 001 |
| [006](006-mobile-menu-collapsible-height.md) | Mobile menu: animate the Categorías collapsible | LOW | TODO | 001 |

## Recommended execution order

001 → 002 → 003 → 004 → 005 → 006.

001 is a hard prerequisite for all the others (they consume its tokens and
append to its reduced-motion block). 002 and 003 are the whole meaningful win:
they cover the copy/download loop the product exists for. 004–006 are optional
polish and independent of each other.

003, 004 and 005 each append rules to the same two places in
`src/styles/globals.css` (`@layer components` and the reduced-motion block). Run
them one after another, not in parallel worktrees, or expect a trivial merge
conflict.

## Deliberately not planned

| Item | Why |
| --- | --- |
| Cross-page fade / view transitions | Navigation is the core loop; a crossfade on every hop makes a fast static site feel slower |
| Staggered entrance on logo and category grids | Dense prerendered content users scan; stagger delays what they came to read |
| Hover nudge on catalog rows (`components/entity-preview-card.tsx:26`) | Hundreds of rows hovered constantly; instant colour is right |
| Empty-state animation on search | Search is submit-and-reload; nothing swaps in-page |
| Swipe-to-dismiss on the mobile sheet | Would be a new interaction, not a missing bridge |

## Residual backlog (for `review-animations`, not this pass)

| Item | Location |
| --- | --- |
| Sheet uses `ease-in-out`, 500ms in / 300ms out; should be the drawer curve | `components/ui/sheet.tsx:61` |
| `transition-all` outside the Button | `components/flag-card.tsx:27`, `components/ui/accordion.tsx:38` |
| Label swap changes button width ("Copiado" vs "Copiar como Markdown") — layout, not motion | `components/docs-copy-markdown-button.tsx:30` |
| Possible post-hydration snap from full catalog to filtered results with `?q=` (inferred, not observed) | `components/home-page.tsx:133` |
