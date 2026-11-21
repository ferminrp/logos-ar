# AGENTS.md

## Skills de UI y motion

Skills de UI y motion (emilkowalski/skills, en `.cursor/skills/`): usá emil-design-eng y animate/choreograph/gestures cuando construyas o cambies UI o animaciones; break-ui y review-animations antes de abrir un PR con cambios visuales.

## Cursor Cloud specific instructions

**Product**: Loguitos (Logos Argentina) — a catalog of Argentine brand logos/favicons across ~22 categories (banks, fintechs, retail, media, telecom, state entities, etc.) plus country flags, served with **Astro 7** on **Cloudflare Workers** (`@astrojs/cloudflare`). Live at https://loguitos.app. No database. Optional env: `PUBLIC_SITE_URL` (canonical host for SEO; defaults to `https://loguitos.app`).

**Single service**: `pnpm dev` (Astro on port **4321**) or `pnpm start` (`wrangler dev` after build).

### Standard commands

See `README.md` for full details. Quick reference:

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` |
| Lint | `pnpm lint` |
| Build | `pnpm build` |
| Local Worker | `pnpm start` |
| Typecheck | `pnpm typecheck` |
| Tests (offline) | `pnpm test` |
| Logo quality (network) | `pnpm check:logos` |
| Sync logos → R2 | `pnpm sync:logos-r2` |
| Sync isotipos → R2 | `pnpm sync:isotipos-r2` (`--dry-run`; API token required for metadata) |
| E2E verify | `pnpm verify:loguitos all` |

### Known issues / gotchas

- **CI builds the Worker**: `pnpm build` runs `prebuild` (datasets, redirects JSON), Astro build, then `postbuild` sitemap generate + verify.
- **Logo download** (`/api/logo-download`) runs on WASM in the Worker: `@jsquash/*` codecs, `@cf-wasm/photon` and `@resvg/resvg-wasm`. Native `sharp` is a dev dependency used only by scripts and tests.
- **CI**: `pnpm lint`, `astro check` (`pnpm typecheck`) and `pnpm test` on every PR.
- **Logo quality gate**: `pnpm check:logos` (network) — see workflow `logo-quality.yml`.
- **Deploy**: `wrangler deploy` uses `wrangler.jsonc` (`workers_dev: false`, `preview_urls: true`); production is https://loguitos.app.
- **Hosted logos**: public URLs stay `/logos/<slug>.png` (and `.svg`). Isotipos: `/logos/<slug>/isotipo.svg` (R2 key `…/isotipo.svg`, fallback `public/isotipos/`). The Worker serves from R2 binding `LOGOS` → bucket `loguitos-assets`, with `ASSETS` fallback. Upload logos: `pnpm sync:logos-r2`; isotipos: `pnpm sync:isotipos-r2` (idempotent; dataset slug guard; metadata via Cloudflare API PUT).
