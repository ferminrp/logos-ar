# AGENTS.md

## Cursor Cloud specific instructions

**Product**: Logos Argentina — a static, client-side-only Next.js 16 app that catalogs Argentine financial entity logos/favicons. No backend, no database, no API routes, no environment variables required.

**Single service**: Next.js dev server (`pnpm dev` on port 3000). No other services needed.

### Standard commands

See `README.md` for full details. Quick reference:

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` |
| Lint | `pnpm lint` |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Tests (offline) | `pnpm test` |
| Logo quality (network) | `pnpm check:logos` |

### Known issues / gotchas

- **ESLint not in devDependencies**: The `pnpm lint` script calls `eslint .` but `eslint` is not listed in `package.json` dependencies. The lint command will fail with `eslint: not found` until it is added as a devDependency.
- **sharp build script warning**: `pnpm install` emits a warning about ignored build scripts for `sharp`. This is harmless — `sharp` is an optional Next.js image optimization dependency and the project uses `images.unoptimized: true` in `next.config.mjs`.
- **No `.env` needed**: The app has zero required environment variables.
- **TypeScript is enforced**: `next build` no longer ignores type errors, and CI runs `pnpm typecheck` + `pnpm test` on every PR.
- **Logo quality gate**: on full-catalog runs (push to main, nightly) failures caused by external services being down (network errors, 429/5xx, Google favicon proxy 404) are warnings, re-checked once after 30s; real quality issues block. If more than max(10, 5%) of entities fail transiently, it blocks (the checker or the runner is broken). On PRs, touched entities block on any failure.
- **Turbopack**: The dev server uses Turbopack by default (Next.js 16). Hot reload is fast.
