# Logo detail page: touch targets and primary contrast

Measured on the filled **Descargar PNG** button (`variant="default"`, `bg-primary` / `text-primary-foreground`) with WCAG relative luminance from computed styles in Chromium.

| Token state | `--primary` | PNG label contrast |
|-------------|-------------|-------------------|
| Before (main) | `oklch(0.62 0.07 240)` | **3.51:1** |
| After (this PR) | `oklch(0.48 0.07 240)` | **6.27:1** (measured on verify drive) |

Target for normal text is **4.5:1** (WCAG AA). Hue and chroma are unchanged; only the `--primary` lightness (and linked `--ring`, `--chart-1`, `--sidebar-primary`, `--sidebar-ring` aliases) were darkened.

Touch targets on `/logo/<slug>` use the shared `Button` size `touch` (`min-height: 2.75rem` / 44px) for download actions and entity copy controls.

Automated check: `pnpm verify:loguitos drive` writes `logo-detail-a11y.json` and asserts heights ≥ 44px and PNG contrast ≥ 4.5 on `banco-galicia`, `banco-provincia`, and `changan`.
