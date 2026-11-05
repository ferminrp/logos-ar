# Loguitos verification map

Maintained recipes for user-visible behavior. Read this index before driving the app; use each feature file as the step-by-step contract.

## Baseline preconditions

- Dependencies installed: `pnpm install`
- For a disposable production instance: `pnpm verify:loguitos launch` (or `all`)
- Or attach to dev: `VERIFY_LOGUITOS_BASE_URL=http://127.0.0.1:3000` with `pnpm dev` already up
- Run `pnpm verify:loguitos doctor` before browser steps
- Chromium for screenshots: `pnpm exec playwright install chromium`
- Logo asset regression gate (separate from this harness): `pnpm check:logos` after changing hosted PNGs or overrides. Fetches retry transient network errors; CI on PRs only blocks on entities touched in the diff (`LOGO_CHECK_SCOPE=pr`), while local runs and main still enforce the full catalog.
- Do not drive a shared port another developer is using without setting an explicit base URL and port

## Driving conventions

- Prefer placeholder text, visible headings, and route paths over CSS classes
- HTTP checks use `curl` or `fetch` against the same base URL as the browser
- Mobile layout uses viewport 390×844; desktop uses 1280×800
- Proof artifacts go to `.verify-loguitos/artifacts/<run-id>/`

## Proof and skip reporting

- Record the feature id and entry point on every artifact
- A failed precondition is a failure with the reason in `Gotchas`, not a skipped pass via another path

## Feature entry contract

Each feature file has four H2 sections in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify-loguitos`, `Gotchas`.

## Features

- [Home search](./home-search.md) — filter entities and flags from the home page via `?q=`
- [Logo entity detail](./logo-detail.md) — per-entity page with downloads and favicon URLs
- [Brand verify slot](./brand-verify-slot.md) — Opción B house ad before disclaimer on `/logo/<slug>`
- [Logos API](./api-logos.md) — JSON catalog at `/api/logos`
- [API docs](./docs-page.md) — static documentation at `/docs`
- [Category hub](./category-hub.md) — browse a category such as bancos
- [SEO / CTR](./seo-ctr.md) — category landing copy, entity metadata, permanent slug redirects
