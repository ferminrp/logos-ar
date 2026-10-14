---
name: verify-loguitos
description: End-to-end verification for Logos Argentina (Loguitos) — static Next.js catalog on port 3000 by default. Use after UI, API, dataset, or routing changes to build, launch a disposable instance, smoke HTTP and browser flows, and capture proof artifacts.
---

# Verify Loguitos (Logos Argentina)

Loguitos is a client-side Next.js 16 app: home search, category hubs, per-entity logo pages, `/docs`, and JSON at `/api/logos`. No database or required env vars for local runs.

## Launch

From the repo root, with dependencies installed (`pnpm install`):

```bash
pnpm verify:loguitos launch
```

This runs `pnpm build` (generates datasets, sitemap, and production `.next`), then starts `next start` on a disposable port (default **3100**, override with `VERIFY_LOGUITOS_PORT`). State and PID live under `.verify-loguitos/runs/<run-id>/`.

Ready when `curl -sf "http://127.0.0.1:$VERIFY_LOGUITOS_PORT/"` returns HTML containing `Logos Argentina`.

To reuse an already-running server (for example `pnpm dev` on 3000), skip launch and set:

```bash
export VERIFY_LOGUITOS_BASE_URL=http://127.0.0.1:3000
```

Two instances can run side by side if each uses its own `VERIFY_LOGUITOS_PORT` and run directory. Do not attach verification to a server you did not start unless `VERIFY_LOGUITOS_BASE_URL` is set intentionally.

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

Exit code non-zero on any failure. Run doctor whenever a drive step fails before retrying browser actions.

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
| Sitemap (postbuild) | `node --experimental-strip-types scripts/verify-sitemap.mts` (runs automatically on `pnpm build` via `postbuild`) |

Playwright is a devDependency; first browser run needs `pnpm exec playwright install chromium`.

## Maintenance

When routes, copy, or API shape change, run `/maintain-verification-skill` against this skill and update the matching file under `features/`.
