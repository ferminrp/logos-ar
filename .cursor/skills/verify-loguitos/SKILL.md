---
name: verify-loguitos
description: End-to-end verification for Logos Argentina (Loguitos) — Astro on Cloudflare Workers (`wrangler dev`, default verify port 3100). Use after UI, API, dataset, or routing changes to build, launch a disposable instance, smoke HTTP and browser flows, and capture proof artifacts.
---

# Verify Loguitos (Logos Argentina)

Loguitos is an **Astro 7** + Cloudflare Workers app: home search, category hubs, per-entity logo pages, `/docs`, JSON at `/api/logos`, and raster/SVG logo download at `/api/logo-download`. No database or required env vars for local runs.

## Launch

From the repo root, with dependencies installed (`pnpm install`):

```bash
pnpm verify:loguitos launch
```

This runs `pnpm build` (prebuild datasets, Astro build, postbuild sitemap), then starts `wrangler dev` on a disposable port (default **3100**, override with `VERIFY_LOGUITOS_PORT`). State and PID live under `.verify-loguitos/runs/<run-id>/`.

Ready when `curl -sf "http://127.0.0.1:$VERIFY_LOGUITOS_PORT/"` returns HTML containing `Logos Argentina`.

To reuse an already-running server (for example `pnpm dev` on **4321** or `pnpm start` after `pnpm build`), skip launch and set:

```bash
export VERIFY_LOGUITOS_BASE_URL=http://127.0.0.1:4321
```

Two instances can run side by side if each uses its own `VERIFY_LOGUITOS_PORT` and run directory. Do not attach verification to a server you did not start unless `VERIFY_LOGUITOS_BASE_URL` is set intentionally.

### Offline preflight (CI parity)

On dataset, routing, or tooling changes, run these before `launch` / `all` (same as `.github/workflows/ci.yml` on every PR and push to main):

```bash
pnpm typecheck
pnpm test
```

`pnpm build` inside `launch` also fails on TypeScript errors (`astro check` / build).

Teardown:

```bash
pnpm verify:loguitos cleanup
```

Cleanup reads the PID file for the active run and stops only that process. It does not delete proof artifacts under `.verify-loguitos/artifacts/`.

## Doctor

```bash
pnpm verify:loguitos doctor
```

Read-only checks before driving:

- TCP reachability of the base URL
- `GET /` → 200 and HTML
- `GET /docs` → 200
- `GET /api/logos?q=galicia&limit=5` → 200, JSON `items` array with at least one match whose `name` or `domain` mentions galicia (case-insensitive)
- `GET /robots.txt` → 200
- `GET /categoria/bancos` → 200, HTML contains SEO H1 `Logos de bancos argentinos`, prominent link to `/logo/banco-de-la-nacion-argentina`, and heading `Logo Banco Nación (BNA)`
- `GET /logo/banco-provincia` → 200, HTML contains entity meta description and a compact `<title>` from `lib/entity-seo.ts` (suffix `| Loguitos`, length ≤ 60, no mid-word ellipsis)
- `GET /logo/banco-de-la-nacion-argentina` → 200, `<title>` fits the same compact budget and includes `BNA`, `Banco Nación`, `PNG y SVG`, and `gratis`; HTML includes brand verify `<aside aria-label="Para equipos de marca">` before the disclaimer
- `GET /logo/uala` → 200, verify slot CTA uses `mailto:marcas@loguitos.app?subject=Logo%20verificado%20-%20Ual%C3%A1`
- `GET /logo/melia` → 404 Not Found (`lib/gone-logo-slugs.ts`; removed catalog entry; not in sitemap)
- GSC priority logo titles — for each slug in `arca-ex-afip`, `mercado-libre`, `tn`, `modo`, `naranja-x`, `infobae`: 200, compact `<title>` (≤ 60, `| Loguitos`, no `…`) with `PNG y SVG` and `gratis`
- `GET /logo/changan` → 200, HTML mentions Changan (GSC batch brand)
- `GET /api/logos?q=meli&limit=5` → 200, at least one item matches Mercado Libre / `mercadolibre` (GSC alias in search text)
- `GET /api/logo-download?domain=www.galicia.ar&format=png&size=128` (and `ripio.com` 512, `mercadolibre.com.ar` 256, hosted `naranjax.com`, fallback `bbva.com.ar`) → 200 with `image/png`, or wasm-budget passthrough `image/jpeg` / `image/webp`
- `GET /categoria/delivery`, `/logo/banco-provincia-bs-as`, `/logo/tn-todo-noticias` with `redirect: manual` → 301 or 308 to the canonical paths in `data/permanent-redirects.json`

Exit code non-zero on any failure. HTTP checks run concurrently (`Promise.all`). Run doctor whenever a drive step fails before retrying browser actions.

## Drive

One-shot proof (launch if needed, doctor, drive home search, capture evidence, cleanup server):

```bash
pnpm exec playwright install chromium
pnpm verify:loguitos all
```

Subcommands:

| Command | Purpose |
|---------|---------|
| `launch` | Build (if needed) and start production server on disposable port |
| `doctor` | HTTP smoke checks |
| `drive` | Browser checks + screenshots (requires Chromium via Playwright) |
| `cleanup` | Stop server started by this harness |
| `all` | `launch` → `doctor` → `drive` → `cleanup` |

Browser harness: Playwright Chromium against `VERIFY_LOGUITOS_BASE_URL` (or the launched instance). Stable handles:

- Mobile search results: navigate to `/?q=galicia` at 390×844 (navbar and `main` both expose the same placeholder; prefer the URL or `main form` to avoid duplicate locators)
- Results copy: text `Resultados para "galicia"` on `/?q=galicia`
- Entity page: `GET /logo/banco-galicia` shows heading `Logo Banco Galicia`
- Docs: `GET /docs` shows `API de logos`

Feature recipes with more entry points live under [`features/`](./features/README.md). For a full pass, drive each feature file; for a quick PR check, `all` covers **home-search** (see `features/home-search.md`).

## Evidence

Default artifact directory: `.verify-loguitos/artifacts/<run-id>/` (also symlinked as `latest` after a successful `all` or `drive`).

| File | Proves |
|------|--------|
| `doctor.json` | HTTP smoke results |
| `home-desktop.png` | Home catalog renders (1280×800) |
| `home-search-mobile.png` | Mobile search results for `galicia` (390×844) |
| `logo-detail-desktop.png` | Entity detail for Banco Galicia |
| `category-bancos-seo-desktop.png` | Category SEO landing for bancos (feature: seo-ctr) |
| `brand-verify-{slug}-{390\|1440}-{light\|dark}.png` | Brand verify aside on `uala` and `banco-de-la-nacion-argentina` (feature: brand-verify-slot) |
| `brand-verify-{slug}-{390\|1440}-{light\|dark}-focus.png` | Same aside with CTA `:focus-visible` ring |
| `brand-verify-metrics.json` | Measured `--slot-border` vs `--background` contrast (light/dark) |
| `drive-summary.txt` | Human-readable pass/fail log |

Proof standards: use real routes and the public API, not test-only hooks. Capture the action (navigation or search) and the resulting UI or JSON, not only a generic 200. Cleanup must not remove these files.

## Cleanup

```bash
pnpm verify:loguitos cleanup
```

Stops the server recorded in `.verify-loguitos/runs/latest/server.json`. If no run file exists, cleanup is a no-op. Artifacts remain for the PR or agent transcript.

## Helpers

| Script | Invocation |
|--------|------------|
| Main harness | `pnpm verify:loguitos <launch\|doctor\|drive\|cleanup\|all>` |
| Hosted logo QA | `pnpm check:logos` — full catalog fetch with one 30s recheck for entities that failed only on transient external errors (network, timeout, 429/5xx, Google favicon-proxy 404). Writes `data/logo-check-report.json`. **Full-catalog runs** (local default, push to main, nightly): real quality problems block; transient-only failures are warnings unless more than `max(10, 5%)` of entities are transient (then treated as a broken checker/runner). **PR runs** (`LOGO_CHECK_SCOPE=pr`, set in CI): entities touched in the diff block on any failure; others are out of scope. Logo-quality workflow uploads the JSON report and prints a step summary. |
| Override logo-download sweep | `pnpm verify:loguitos sweep-logo-download` — hits `/api/logo-download` for every key in `data/logo-overrides.json` (default `LOGO_DOWNLOAD_SWEEP_FORMATS=png`, set `png,svg` for both). Set `LOGO_DOWNLOAD_SWEEP_SIZE` (128/512). Set `LOGO_DOWNLOAD_MAIN_BASE` to a second running instance when comparing regressions across deploys; writes `main-vs-pr.json` under `.verify-loguitos/artifacts/logo-download-sweep/`. Optional domain list: `LOGO_DOWNLOAD_DOMAIN_LIST=/path/to/domains.txt`. With `LOGO_DOWNLOAD_SWEEP_WASM_AUDIT=1`, also writes `wasm-raster-risks.json`. PNG sweeps accept `image/png` or wasm-budget passthrough (`image/jpeg` / `image/webp`). |
| Sitemap (postbuild) | `node --experimental-strip-types scripts/verify-sitemap.mts` (runs automatically on `pnpm build` via `postbuild`) |

Playwright is a devDependency; first browser run needs `pnpm exec playwright install chromium`.

## Maintenance

When routes, copy, or API shape change, run `/maintain-verification-skill` against this skill and update the matching file under `features/`.
