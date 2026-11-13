# 001 — Add motion tokens and a reduced-motion policy

- **Status**: DONE
- **Commit**: 4b97e8b
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens / Accessibility
- **Estimated scope**: 1 file (`src/styles/globals.css`), ~40 added lines

## Problem

The repo has no easing or duration tokens and no `prefers-reduced-motion`
handling anywhere in `src/`, `components/`, `views/` or `styles/`. Motion today
is `tw-animate-css` defaults plus bare Tailwind `transition-*` utilities. Plans
002–006 all need the same curve and durations; without shared tokens each would
hand-type its own cubic-bezier.

```css
/* src/styles/globals.css:1-6 — current */
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  /* Granola-inspired warm editorial palette */
```

```css
/* src/styles/globals.css:146-151 — current (end of file) */
@layer components {
  .brand-verify-slot__cta:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
}
```

## Target

Tokens live in `:root`, **not** in the `@theme inline` block. In Tailwind v4 a
theme variable named `--ease-out` replaces the value of the built-in `ease-out`
utility, which would silently change every existing `ease-out` class and the
`tw-animate-css` accordion default. The `--motion-*` prefix avoids that: these
are plain custom properties with no Tailwind utility attached.

```css
/* target — inserted inside :root, after the --logo-download-png-foreground line (currently line 45) */
  /* Motion tokens (plain custom properties; deliberately NOT in @theme so
     Tailwind's built-in ease-* utilities keep their default values) */
  --motion-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --motion-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --motion-ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --motion-duration-fast: 150ms;
  --motion-duration-press: 160ms;
  --motion-duration-normal: 200ms;
```

```css
/* target — appended at the very end of the file, after the @layer components block */

/*
 * Reduced motion policy: fewer and gentler, not zero.
 * Keep opacity and colour feedback; drop travel (translate, large scale, height).
 * - tw-animate-css enter/exit keyframes read the --tw-enter-* / --tw-exit-* vars
 *   below, so zeroing them turns slides and zooms into plain fades.
 * - Press feedback (active:scale-[0.97]) is kept: it is 3% and is feedback, not travel.
 * - Any NEW movement added to this repo must ship its own reduced-motion branch
 *   (a `motion-reduce:` class or a rule inside this media query).
 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    --tw-enter-translate-x: 0 !important;
    --tw-enter-translate-y: 0 !important;
    --tw-exit-translate-x: 0 !important;
    --tw-exit-translate-y: 0 !important;
    --tw-enter-scale: 1 !important;
    --tw-exit-scale: 1 !important;
    --tw-enter-rotate: 0 !important;
    --tw-exit-rotate: 0 !important;
  }
}
```

## Repo conventions to follow

- Global CSS lives in one file, `src/styles/globals.css`. Raw design values go
  in `:root` (and `.dark` when they differ by theme); motion tokens do not differ
  by theme, so they go in `:root` only.
- Component-level custom CSS goes in the existing `@layer components` block
  (`src/styles/globals.css:146`). The reduced-motion block goes **outside** any
  `@layer`, at the end of the file, so it wins over layered utilities.
- Tokens are consumed from Tailwind classes as arbitrary values, e.g.
  `duration-[var(--motion-duration-press)] ease-[var(--motion-ease-out)]`, and
  from plain CSS as `var(--motion-ease-out)`.
- 2-space indentation, lowercase hex-free CSS, comments in `/* */`.

## Steps

1. In `src/styles/globals.css`, inside the first `:root { … }` block, add the
   six `--motion-*` declarations (and their comment) from the first Target
   snippet immediately after `--logo-download-png-foreground: oklch(0.99 0.002 95);`
   and before the closing `}`. Do not add them to `.dark` or to `@theme inline`.
2. Append the reduced-motion comment and `@media (prefers-reduced-motion: reduce)`
   block from the second Target snippet at the end of the file, after the closing
   `}` of `@layer components`, separated by one blank line.

## Boundaries

- Do NOT touch any file other than `src/styles/globals.css`.
- Do NOT add anything to the `@theme inline` block, and do NOT name any token
  `--ease-*`, `--duration-*` or `--animate-*`.
- Do NOT change any existing declaration, colour, or the `@layer base` block.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm install` (if `node_modules` is missing), then
  `pnpm lint` and `pnpm typecheck` — both exit 0. `pnpm build` completes.
  `grep -c -- "--motion-" src/styles/globals.css` prints `6`.
- **Feel check**: `pnpm dev` (http://localhost:4321), then:
  - Nothing should look different with normal motion settings; this plan only
    adds unused tokens.
  - On a narrow viewport open the hamburger menu and the FAQ accordion on the
    home page: both must animate exactly as before (proves `ease-out` was not
    redefined).
  - In DevTools → Rendering, set `prefers-reduced-motion: reduce` and open the
    hamburger menu: the overlay still fades, the panel no longer slides in from
    the right.
- **Done when**: the six tokens resolve in DevTools on `<html>` (Computed →
  filter `--motion`), and the reduced-motion check above passes.
