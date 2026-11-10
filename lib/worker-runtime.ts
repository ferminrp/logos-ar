/** True on Cloudflare Workers and Miniflare/workerd (incl. `wrangler dev`). */
export function isCloudflareWorkersRuntime(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    navigator.userAgent === 'Cloudflare-Workers'
  )
}

/**
 * Node.js with a real filesystem (unit tests / local scripts).
 * Never true on Workers, even with `nodejs_compat` (`process.versions.node` is set there too).
 */
export function isNodeFilesystemRuntime(): boolean {
  if (isCloudflareWorkersRuntime()) {
    return false
  }
  return typeof process !== 'undefined' && process.release?.name === 'node'
}
