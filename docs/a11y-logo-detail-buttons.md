# Logo detail page: touch targets and PNG download contrast

Measured on the filled **Descargar PNG** button (`variant="logo-download-png"`) with WCAG relative luminance from computed styles in Chromium. Site-wide `--primary` stays at `oklch(0.62 0.07 240)`; only this control uses the local tokens below.

| State | Background token | PNG label contrast (default / hover) |
|-------|------------------|--------------------------------------|
| Before (main, `bg-primary`) | `--primary` | **3.51:1** |
| After (this PR) | `--logo-download-png` / `--logo-download-png-hover` | see `logo-detail-a11y.json` from verify drive |

Target for normal text is **4.5:1** (WCAG AA). Hue and chroma match `--primary`; lightness is reduced only on the download PNG tokens.

Touch targets on `/logo/<slug>` use the shared `Button` size `touch` (`min-height: 2.75rem` / 44px) for download actions and entity copy controls.

Automated check: `pnpm verify:loguitos drive` writes `logo-detail-a11y.json` and asserts heights ≥ 44px and PNG contrast ≥ 4.5 (default and hover) on `banco-galicia`, `banco-provincia`, and `changan`.
