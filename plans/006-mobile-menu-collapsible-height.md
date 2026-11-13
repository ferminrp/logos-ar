# 006 — Mobile menu: animate the Categorías collapsible

- **Status**: DONE
- **Commit**: 4b97e8b
- **Severity**: LOW
- **Category**: Missed opportunities (state indication)
- **Estimated scope**: 1 file (`components/site-navbar.tsx`), 1 line; optionally `src/styles/globals.css` if the fallback is needed

## Problem

In the mobile menu sheet, the "Categorías" chevron rotates with a transition but
the list it controls snaps open and shut, so the two halves of one control
disagree.

```tsx
// components/site-navbar.tsx:140-145 — current
                  <Collapsible defaultOpen className="space-y-2">
                    <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-xl border border-border/80 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
                      Categorías
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 pl-1">
```

`components/ui/collapsible.tsx:22-31` forwards all props (including `className`)
to the Radix primitive and adds no classes of its own.

## Target

Mirror what the FAQ accordion already does, using the collapsible utilities that
`tw-animate-css` ships.

```tsx
// components/site-navbar.tsx:145 — target
                    <CollapsibleContent className="space-y-1 overflow-hidden pl-1 duration-[var(--motion-duration-normal)] ease-[var(--motion-ease-out)] data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none">
```

> **Amended (after first execution):** the original target used a bare
> `motion-reduce:animate-none`. It compiles to `.motion-reduce\:animate-none`
> (specificity 0,1,0), which loses to
> `.data-\[state\=closed\]\:animate-collapsible-up[data-state=closed]` (0,2,0),
> so the height kept animating under reduced motion. The state-scoped variants
> above compile to (0,2,0) selectors inside the media query and win; verified in
> the browser with reduced motion emulated. No CSS fallback in `globals.css` was
> needed.

Resolved values: height `0 ↔ var(--radix-collapsible-content-height)`, 200ms,
`cubic-bezier(0.23, 1, 0.32, 1)`. Measured height is the documented exception to
"transform and opacity only". Reduced motion: no height animation (instant, as
today).

How the classes work: `tw-animate-css` 1.4.0 (the version pinned in
`pnpm-lock.yaml`) defines

```
--animate-collapsible-down: collapsible-down var(--tw-animation-duration, var(--tw-duration, .2s)) var(--tw-ease, ease-out) …
--animate-collapsible-up:   collapsible-up   var(--tw-animation-duration, var(--tw-duration, .2s)) var(--tw-ease, ease-out) …
```

so `duration-[…]` and `ease-[…]` on the same element feed `--tw-duration` and
`--tw-ease`. This was confirmed against the published 1.4.0 package, not against
an installed `node_modules`; step 2 re-checks it.

Because the collapsible is `defaultOpen`, Radix suppresses the animation on
mount, so opening the sheet does not replay it.

## Repo conventions to follow

- Exemplar: `components/ui/accordion.tsx:58` —
  `className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"`.
- Motion tokens are the `--motion-*` properties from plan 001, consumed as
  Tailwind arbitrary values.
- The class goes on the usage in `components/site-navbar.tsx`, not in
  `components/ui/collapsible.tsx`: that primitive is a bare shadcn pass-through
  and this is its only live consumer.

## Steps

1. Confirm plan 001 is applied: `grep -n -- "--motion-duration-normal" src/styles/globals.css`
   prints one line. If not, STOP — do plan 001 first.
2. Verify the utilities exist in the installed package (run `pnpm install` first
   if `node_modules` is missing):
   `grep -c "animate-collapsible-down" node_modules/tw-animate-css/dist/tw-animate.css`
   - If it prints `1` or more, go to step 3 and skip step 4.
   - If it prints `0` or the file is missing, do step 3 **and** step 4.
3. `components/site-navbar.tsx:145` — replace `className="space-y-1 pl-1"` with
   the className from Target.
4. **Fallback only** (step 2 printed 0). In `src/styles/globals.css`, add inside
   the `@theme inline { … }` block:

   ```css
     --animate-collapsible-down: collapsible-down var(--tw-duration, 200ms) var(--tw-ease, ease-out);
     --animate-collapsible-up: collapsible-up var(--tw-duration, 200ms) var(--tw-ease, ease-out);

     @keyframes collapsible-down {
       from {
         height: 0;
       }
       to {
         height: var(--radix-collapsible-content-height);
       }
     }

     @keyframes collapsible-up {
       from {
         height: var(--radix-collapsible-content-height);
       }
       to {
         height: 0;
       }
     }
   ```

## Boundaries

- Do NOT edit `components/ui/collapsible.tsx`, `components/ui/accordion.tsx` or
  `components/ui/sheet.tsx`. The sheet's own timing (`ease-in-out`, 500ms in /
  300ms out at `components/ui/sheet.tsx:61`) is a separate finding.
- Do NOT change `defaultOpen`, the trigger, the chevron, or the links inside.
- Do NOT add an opacity fade or stagger to the links.
- Do NOT add new dependencies or change the `tw-animate-css` version.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm lint` and `pnpm typecheck` exit 0; `pnpm build` completes.
- **Feel check**: `pnpm dev`, narrow the viewport below the `lg` breakpoint
  (or use device emulation), open the hamburger menu, then:
  - The category list is already open and does not animate when the sheet
    slides in.
  - Tap "Categorías": the list collapses smoothly while the chevron rotates;
    tap again and it expands. The GitHub button below moves with it, no jump at
    the start or end.
  - Tap the trigger several times quickly. Keyframes restart rather than
    retarget, so a brief jump mid-animation is expected here and acceptable for
    a rarely-toggled control; it must never end in a wrong final state.
  - No text is clipped once fully open, and focus rings on the links are not
    cut off (`overflow-hidden` applies only to the content box; if a ring is
    visibly clipped, report it rather than removing `overflow-hidden`).
  - Animations panel at 10% speed: height runs from 0 to full with the strong
    ease-out (fast start, long settle).
  - Rendering → `prefers-reduced-motion: reduce`: the list snaps, the chevron
    still rotates.
- **Done when**: list and chevron move together, and the reduced-motion variant
  snaps.
