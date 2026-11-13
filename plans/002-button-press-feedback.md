# 002 — Button: press feedback and scoped transition

- **Status**: DONE
- **Commit**: 4b97e8b
- **Severity**: HIGH
- **Category**: Physicality & origin (press feedback) / Performance (`transition: all`)
- **Estimated scope**: 1 file (`components/ui/button.tsx`), 1 line changed

## Problem

The shared Button has hover colours but no `:active` state. On touch devices,
where hover never fires, tapping Copy or Download gives no acknowledgement until
the icon or label changes. These are the product's core actions (tens of times a
day for a regular user). The same line uses `transition-all`, which transitions
every property, including ones nobody intends to animate.

```tsx
// components/ui/button.tsx:7-8 — current
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
```

## Target

Replace the single token `transition-all` with a scoped transition plus a press
scale. Everything else in the string stays byte-for-byte identical.

```tsx
// components/ui/button.tsx:8 — target
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,box-shadow,scale] duration-[var(--motion-duration-press)] ease-[var(--motion-ease-out)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
```

Resolved values: `scale: 0.97` on `:active`; transition 160ms
`cubic-bezier(0.23, 1, 0.32, 1)` on `color, background-color, border-color,
box-shadow, scale`.

Why `scale` is in the property list: this repo is on Tailwind v4, where
`scale-[0.97]` sets the standalone CSS `scale` property, not `transform`. A
`transition-transform` class would not animate it.

Reduced motion: keep the press scale. It is 3%, it is feedback rather than
travel, and plan 001's policy comment says so explicitly. Add nothing.

## Repo conventions to follow

- Motion tokens are `--motion-*` custom properties in `:root` of
  `src/styles/globals.css` (added by plan 001). Consume them from Tailwind as
  arbitrary values: `duration-[var(--motion-duration-press)]`,
  `ease-[var(--motion-ease-out)]`.
- `components/ui/button.tsx` is a shadcn `cva` file; base classes are one long
  string on line 8. Edit in place, keep the double quotes and class order.

## Steps

1. Confirm plan 001 is applied: `grep -n -- "--motion-duration-press" src/styles/globals.css`
   must print one line. If it prints nothing, STOP — do plan 001 first.
2. In `components/ui/button.tsx` line 8, replace the substring `transition-all`
   with
   `transition-[color,background-color,border-color,box-shadow,scale] duration-[var(--motion-duration-press)] ease-[var(--motion-ease-out)] active:scale-[0.97]`.
   Change nothing else on the line.

## Boundaries

- Do NOT touch variants, sizes, or any other file. Other `transition-all`
  occurrences in the repo (e.g. `components/flag-card.tsx:27`,
  `components/ui/accordion.tsx:38`) are out of scope.
- Do NOT add `hover:` motion, `will-change`, or a different scale value.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm lint` and `pnpm typecheck` exit 0; `pnpm build` completes.
  `grep -c "transition-all" components/ui/button.tsx` prints `0`.
- **Feel check**: `pnpm dev`, open any logo page (click a logo on
  http://localhost:4321) and:
  - Press and hold "Descargar PNG": the button shrinks slightly and springs back
    on release. It must read as a tap acknowledgement, not a bounce.
  - Hover colour changes on the outline and ghost buttons still fade as before.
  - Tab to a button with the keyboard: the focus ring still fades in.
  - Disabled buttons (while a download is running) do not scale when clicked.
  - In DevTools → device toolbar (touch emulation), tap a copy button: the
    scale is visible even though hover never fires.
  - In the Animations panel at 10% speed, confirm only `scale` moves on press;
    no layout shift in neighbouring buttons.
- **Done when**: every `<Button>` shows the press scale, and no visual
  regression is seen on hover, focus or disabled states.
