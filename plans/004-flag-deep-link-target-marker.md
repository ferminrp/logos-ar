# 004 — Banderas: mark the deep-linked flag card

- **Status**: TODO
- **Commit**: 4b97e8b
- **Severity**: MEDIUM
- **Category**: Missed opportunities (spatial consistency)
- **Estimated scope**: 2 files, ~35 lines (`src/styles/globals.css`, `views/banderas-page.tsx`)

## Problem

The home page links each flag to `/categoria/banderas#CODE`. The browser scrolls
to the matching card, but that card is one of hundreds in a uniform grid and
nothing marks which one was the destination.

```tsx
// components/flag-preview-card.tsx:13-16 — the link (context only, do not edit)
    <Link
      href={`/categoria/banderas#${flag.code}`}
      className="group flex items-center gap-2"
    >
```

```tsx
// views/banderas-page.tsx:69-73 — current
          {flags.map((flag) => (
            <div key={flag.code} id={flag.code} className="min-w-0">
              <FlagCard flag={flag} />
            </div>
          ))}
```

```tsx
// components/flag-card.tsx:27 — the card root, the wrapper's only child (context only, do not edit)
    <div className="group relative min-w-0 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80">
```

## Target

Two layers, CSS only, driven by `:target`:

1. A persistent state: the targeted card keeps the same border colour the cards
   already use on hover (`hover:border-primary/50`).
2. A one-shot ring that fades out, drawn on a pseudo-element so it never blocks
   input.

```tsx
// views/banderas-page.tsx:70 — target
            <div key={flag.code} id={flag.code} className="flag-target min-w-0">
```

```css
/* src/styles/globals.css — target, added inside the existing @layer components block */
  .flag-target:target > div {
    border-color: color-mix(in oklch, var(--primary) 50%, transparent);
  }

  .flag-target:target > div::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    box-shadow: 0 0 0 2px var(--ring);
    pointer-events: none;
    opacity: 0;
    animation: flag-target-ring 1000ms var(--motion-ease-out) 200ms backwards;
  }

  @keyframes flag-target-ring {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
```

```css
/* src/styles/globals.css — target, added inside the @media (prefers-reduced-motion: reduce) block from plan 001 */
  .flag-target:target > div::after {
    animation: none;
  }
```

Notes on the values:

- 1000ms with a 200ms delay is a fading marker, not interaction latency: nothing
  waits on it and it is opacity-only. It is outside the 300ms UI budget on
  purpose. `backwards` holds the ring at full opacity during the delay so it is
  visible the moment the page settles.
- `inset: -1px` makes the ring sit on the card's 1px border instead of inside it.
- A keyframe (not a transition) is correct here: it runs once per navigation and
  is never interrupted or reversed.
- Reduced motion: the static border stays, the fading ring is dropped.

## Repo conventions to follow

- Component-level custom CSS goes in `@layer components` in
  `src/styles/globals.css` (exemplar: `.brand-verify-slot__cta:focus-visible` at
  `src/styles/globals.css:146-151`). Single quotes are used for CSS strings in
  that file.
- Motion tokens are the `--motion-*` properties from plan 001.
- Navigation in this app is always a full document load
  (`lib/client-navigation.ts:49` uses `window.location.assign`), so `:target`
  is reliably set on arrival; no JS is needed.

## Steps

1. Confirm plan 001 is applied: `grep -n -- "--motion-ease-out" src/styles/globals.css`
   and `grep -n "prefers-reduced-motion" src/styles/globals.css` each print one
   line. If not, STOP — do plan 001 first.
2. `views/banderas-page.tsx:70` — change `className="min-w-0"` to
   `className="flag-target min-w-0"`. Nothing else on the line changes.
3. `src/styles/globals.css` — inside `@layer components { … }`, append the two
   `.flag-target:target` rules and the `@keyframes flag-target-ring` block from
   Target.
4. Same file — inside the `@media (prefers-reduced-motion: reduce) { … }` block,
   append the `.flag-target:target > div::after { animation: none; }` rule.

## Boundaries

- Do NOT edit `components/flag-card.tsx` or `components/flag-preview-card.tsx`.
  The `transition-all` on `components/flag-card.tsx:27` is a separate finding.
- Do NOT add smooth scrolling, `scroll-margin`, a scroll listener, or any JS.
- Do NOT apply the marker to other `:target` elements (category sections on the
  home page are out of scope).
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm lint` and `pnpm typecheck` exit 0; `pnpm build` completes.
- **Feel check**: `pnpm dev`, then:
  - Open http://localhost:4321/categoria/banderas#AR directly: the Argentina
    card has a tinted border and a ring that fades out over about a second.
  - From the home page, click a flag in the "Banderas" block: same result on the
    card you clicked.
  - Open http://localhost:4321/categoria/banderas with no hash: no card is
    marked.
  - Hover and click the copy buttons on the targeted card while the ring is
    visible: they respond normally (the ring has `pointer-events: none`).
  - Check both light and dark theme: the ring colour (`--ring`) is visible
    against the card in both.
  - DevTools → Animations at 10% speed: the ring is fully opaque for the first
    200ms, then fades; nothing moves or resizes.
  - Rendering → `prefers-reduced-motion: reduce`, reload with the hash: tinted
    border only, no ring.
- **Done when**: a deep-linked flag is identifiable at a glance on arrival and
  the page is unchanged without a hash.
