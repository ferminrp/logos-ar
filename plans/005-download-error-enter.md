# 005 — Logo download: ease the error message in

- **Status**: TODO
- **Commit**: 4b97e8b
- **Severity**: LOW
- **Category**: Missed opportunities (preventing a jarring change)
- **Estimated scope**: 2 files, ~20 lines (`src/styles/globals.css`, `components/logo-download-buttons.tsx`)

## Problem

When a download fails, the error paragraph is conditionally rendered: it pops in
under the buttons and pushes the content below it down in one frame.

```tsx
// components/logo-download-buttons.tsx:124-128 — current
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
```

## Target

Entry only, CSS only, via `@starting-style`. No exit animation: the error is
cleared when the user retries and should get out of the way immediately.

```css
/* src/styles/globals.css — target, added inside the existing @layer components block */
  .alert-enter {
    transition:
      opacity var(--motion-duration-normal) var(--motion-ease-out),
      translate var(--motion-duration-normal) var(--motion-ease-out);

    @starting-style {
      opacity: 0;
      translate: 0 -4px;
    }
  }
```

```css
/* src/styles/globals.css — target, added inside the @media (prefers-reduced-motion: reduce) block from plan 001 */
  .alert-enter {
    transition: opacity var(--motion-duration-normal) var(--motion-ease-out);

    @starting-style {
      opacity: 0;
      translate: 0 0;
    }
  }
```

```tsx
// components/logo-download-buttons.tsx:125 — target
        <p className="alert-enter text-sm text-destructive" role="alert">
```

Resolved values: `opacity 0 → 1`, `translate 0 -4px → 0 0`, 200ms,
`cubic-bezier(0.23, 1, 0.32, 1)`. Reduced motion: opacity only.

This does not remove the layout push (the paragraph still takes up space the
moment it mounts); it only stops the text from appearing in a single frame.
Reserving the row would be a layout change and is out of scope.

## Repo conventions to follow

- Component-level custom CSS goes in `@layer components` in
  `src/styles/globals.css` (exemplar: `.brand-verify-slot__cta:focus-visible` at
  `src/styles/globals.css:146-151`). If plan 003 is already applied, put
  `.alert-enter` directly after `.icon-enter`; it follows the same pattern.
- Motion tokens are the `--motion-*` properties from plan 001.
- Tailwind v4 (Lightning CSS) handles native nesting and `@starting-style`.

## Steps

1. Confirm plan 001 is applied: `grep -n -- "--motion-duration-normal" src/styles/globals.css`
   and `grep -n "prefers-reduced-motion" src/styles/globals.css` each print one
   line. If not, STOP — do plan 001 first.
2. `src/styles/globals.css` — inside `@layer components { … }`, append the first
   `.alert-enter` rule from Target.
3. Same file — inside the `@media (prefers-reduced-motion: reduce) { … }` block,
   append the second `.alert-enter` rule.
4. `components/logo-download-buttons.tsx:125` — add `alert-enter ` at the start
   of the `<p>` className. Keep `role="alert"`.

## Boundaries

- Do NOT add an exit animation, a wrapper element, or change the conditional.
- Do NOT touch the download logic, the buttons, or the "Descargando..." label
  swap in the same file.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm lint` and `pnpm typecheck` exit 0; `pnpm build` completes.
- **Feel check**: `pnpm dev`, open any logo page, then force a failure: DevTools
  → Network → right-click the download request URL pattern and "Block request
  URL" (or switch to Offline), and click "Descargar PNG".
  - The error text fades in with a small downward settle instead of popping.
  - Click the button again: the old error disappears instantly and, on the
    second failure, the new one eases in again.
  - Animations panel at 10% speed: the text travels 4px, no more.
  - Rendering → `prefers-reduced-motion: reduce`: fade only, no travel.
  - A screen reader still announces the message (the `role="alert"` element is
    unchanged).
- **Done when**: the error eases in on every failure and clears instantly on
  retry.
