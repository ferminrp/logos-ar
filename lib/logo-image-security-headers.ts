/** Harden logo image responses against MIME sniffing and SVG script XSS. */
export const LOGO_IMAGE_NOSNIFF = 'nosniff'

export const LOGO_SVG_CONTENT_SECURITY_POLICY =
  "default-src 'none'; style-src 'unsafe-inline'; sandbox"

export function applyLogoPngSecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', LOGO_IMAGE_NOSNIFF)
}

export function applyLogoSvgSecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', LOGO_IMAGE_NOSNIFF)
  headers.set('Content-Security-Policy', LOGO_SVG_CONTENT_SECURITY_POLICY)
}

export function logoDownloadPngHeaders(
  base: Record<string, string>,
): Record<string, string> {
  return { ...base, 'X-Content-Type-Options': LOGO_IMAGE_NOSNIFF }
}

export function logoDownloadSvgHeaders(
  base: Record<string, string>,
): Record<string, string> {
  return {
    ...base,
    'X-Content-Type-Options': LOGO_IMAGE_NOSNIFF,
    'Content-Security-Policy': LOGO_SVG_CONTENT_SECURITY_POLICY,
  }
}