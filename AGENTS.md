# AGENTS.md

## Cursor Cloud specific instructions

**Product**: Logos Argentina — a static catalog of Argentine financial entity logos/favicons, served with **Astro 5** on **Cloudflare Workers** (`@astrojs/cloudflare`). No database. Optional env: `PUBLIC_SITE_URL` (canonical host for SEO; defaults to `https://loguitos.app`).

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
| E2E verify | `pnpm verify:loguitos all` |

### Known issues / gotchas

- **CI builds the Worker**: `pnpm build` runs `prebuild` (datasets, redirects JSON), Astro build, then `postbuild` sitemap generate + verify.
- **Logo download** uses `@img/sharp-wasm32` in the Worker (not native `sharp`).
- **TypeScript**: `astro check` on every PR with `pnpm test`.
- **Logo quality gate**: unchanged from Next era — see README / workflow `logo-quality.yml`.
- **Deploy**: `wrangler deploy` uses `wrangler.jsonc` (`workers_dev: true` until DNS cutover). No custom routes in wrangler yet.
