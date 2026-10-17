export const MIN_LOGO_BYTES = 1536
export const MIN_LOGO_PX = 64
export const GOOGLE_FAVICON_CHECK_SIZE = 128

/** SHA-256 of favicon bytes known to be Google's generic placeholder globe. */
export const GENERIC_FAVICON_SHA256 = new Set<string>([
  "a8b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01",
])

export const REDIRECT_BRAND_MISMATCH: Record<string, string> = {}
