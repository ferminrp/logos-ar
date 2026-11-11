# Logo detail page: touch targets and PNG download contrast

Measured on **Descargar PNG** (`variant="logo-download-png"`) and **Descargar SVG** (outline) with WCAG relative luminance in Chromium. SVG checks composite semi-transparent button backgrounds over the page.

Site-wide `--primary` stays at `oklch(0.62 0.07 240)`. Download PNG uses local tokens:

- `--logo-download-png` / `--logo-download-png-hover` (background)
- `--logo-download-png-foreground` (label and icon, light in **both** `:root` and `.dark`)

| State | PNG background | PNG label contrast (light / dark) |
|-------|----------------|-----------------------------------|
| Before (main, `bg-primary`) | `--primary` | **3.51:1** / fails in dark |
| After | `--logo-download-png` tokens | see `logo-detail-a11y.json` |

Target for normal text is **4.5:1** (WCAG AA) at rest and on hover.

Touch targets on `/logo/<slug>` use the shared `Button` size `touch` (44px) for download actions and entity copy controls.

Automated check: `pnpm verify:loguitos drive` writes `logo-detail-a11y.json` and asserts heights ≥ 44px plus PNG/SVG contrast ≥ 4.5 (default and hover) in **light and dark** on four slugs at 390px and 1440px widths.
