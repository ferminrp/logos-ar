export const MIN_LOGO_BYTES = 1536
export const MIN_LOGO_PX = 64
export const GOOGLE_FAVICON_CHECK_SIZE = 128

/** SHA-256 of favicon bytes known to be Google's generic placeholder globe. */
export const GENERIC_FAVICON_SHA256 = new Set<string>([
  "59bfe9bc385ad69f50793ce4a53397316d7a875a7148a63c16df9b674c6cda64",
])

export const REDIRECT_BRAND_MISMATCH: Record<string, string> = {}
