# 003 — Copy buttons: ease the success check in

- **Status**: TODO
- **Commit**: 4b97e8b
- **Severity**: MEDIUM
- **Category**: Missed opportunities (state indication)
- **Estimated scope**: 4 files, ~15 lines (`src/styles/globals.css`, `components/copy-button.tsx`, `components/flag-card.tsx`, `components/docs-copy-markdown-button.tsx`)

## Problem

Copying is what this product is for, and its only success signal is the `Copy`
icon being hard-swapped for `Check` by a conditional render. The swap teleports.
It happens in four places:

```tsx
// components/copy-button.tsx:39-43 — current
      {copied ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
```

```tsx
// components/flag-card.tsx:61-65 — current
          {copiedField === "svg-url" ? (
            <Check className="mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          )}
```

```tsx
// components/flag-card.tsx:75-79 — current
          {copiedField === "img-snippet" ? (
            <Check className="mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          )}
```

```tsx
// components/docs-copy-markdown-button.tsx:25-29 — current
      {copied ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
```

## Target

Animate only the entering `Check`. `Check` and `Copy` are different components,
so React mounts a fresh element on the swap and `@starting-style` gives it an
entry transition with no JS. The swap back to `Copy` after 2s stays instant —
the user has moved on by then.

One shared class in the existing `@layer components` block:

```css
/* src/styles/globals.css — target, added inside the existing @layer components block */
  .icon-enter {
    transition:
      opacity var(--motion-duration-fast) var(--motion-ease-out),
      scale var(--motion-duration-fast) var(--motion-ease-out);

    @starting-style {
      opacity: 0;
      scale: 0.95;
    }
  }
```

```css
/* src/styles/globals.css — target, added inside the @media (prefers-reduced-motion: reduce) block from plan 001 */
  .icon-enter {
    transition: opacity var(--motion-duration-fast) var(--motion-ease-out);

    @starting-style {
      opacity: 0;
      scale: 1;
    }
  }
```

Resolved values: `opacity 0 → 1` and `scale 0.95 → 1`, 150ms,
`cubic-bezier(0.23, 1, 0.32, 1)`. Reduced motion: opacity only.

Each `Check` gets the class appended; `Copy` is unchanged:

```tsx
// components/copy-button.tsx:40 and components/docs-copy-markdown-button.tsx:26 — target
        <Check className="icon-enter h-4 w-4 text-primary" />
```

```tsx
// components/flag-card.tsx:62 and :76 — target
            <Check className="icon-enter mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />
```

## Repo conventions to follow

- Component-level custom CSS goes in `@layer components` in
  `src/styles/globals.css`; the existing exemplar is
  `.brand-verify-slot__cta:focus-visible` at `src/styles/globals.css:146-151`.
- Motion tokens are the `--motion-*` properties from plan 001. Never hand-type a
  cubic-bezier or a millisecond value in this plan's CSS.
- The repo is on Tailwind v4 (Lightning CSS), which supports native CSS nesting
  and `@starting-style`; no plugin is needed.
- Strings in these three `.tsx` files use double quotes.

## Steps

1. Confirm plan 001 is applied: `grep -n -- "--motion-duration-fast" src/styles/globals.css`
   prints one line and `grep -n "prefers-reduced-motion" src/styles/globals.css`
   prints one line. If not, STOP — do plan 001 first.
2. In `src/styles/globals.css`, inside `@layer components { … }`, after the
   `.brand-verify-slot__cta:focus-visible { … }` rule, add the first `.icon-enter`
   rule from Target.
3. In the same file, inside the `@media (prefers-reduced-motion: reduce) { … }`
   block, after the `*, *::before, *::after { … }` rule, add the second
   `.icon-enter` rule from Target.
4. `components/copy-button.tsx:40` — add `icon-enter ` at the start of the
   `Check` className.
5. `components/flag-card.tsx:62` and `:76` — same, on both `Check` elements.
6. `components/docs-copy-markdown-button.tsx:26` — same.

## Boundaries

- Do NOT animate the `Copy` icon, the swap back, or the label text.
- Do NOT restructure the conditional render, add state, timers, or a wrapper
  element.
- Do NOT fix the width change caused by the label swap at
  `components/docs-copy-markdown-button.tsx:30` ("Copiado" vs "Copiar como
  Markdown"). It is a layout issue, not a motion one; leave it and mention it in
  your report.
- Do NOT touch `components/logo-card.tsx` or `components/config-panel.tsx`
  (not imported by any page).
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm lint` and `pnpm typecheck` exit 0; `pnpm build` completes.
  `grep -rn "icon-enter" components | wc -l` prints `4`.
- **Feel check**: `pnpm dev`, then:
  - On a logo page, click a copy button: the check fades and grows in rather
    than popping. After 2s the copy icon returns instantly.
  - Click the same button five times fast: no flicker, no stuck half-opacity
    icon.
  - On http://localhost:4321/categoria/banderas click "Copiar URL" then
    "Copiar HTML" on one card: each check eases in independently.
  - On http://localhost:4321/docs click "Copiar como Markdown".
  - DevTools → Animations at 10% speed: confirm the check goes from 95% to 100%
    scale and never starts from 0. If the 0.95 start is invisible on the 14–16px
    glyph at normal speed, that is acceptable — the fade carries it. Do not
    lower the scale below 0.9 without asking.
  - Rendering → `prefers-reduced-motion: reduce`: the check only fades.
  - Check Safari if available: `@starting-style` needs Safari 17.5+. Older
    browsers simply show the instant swap, which is the current behaviour.
- **Done when**: all four `Check` icons ease in, and the reduced-motion variant
  is fade-only.
