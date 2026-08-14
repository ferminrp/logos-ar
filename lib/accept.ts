function parseAcceptHeader(accept: string): Map<string, number> {
  const types = new Map<string, number>()

  for (const part of accept.split(",")) {
    const [rawType, ...params] = part.trim().split(";")
    const type = rawType.trim().toLowerCase()
    if (!type) continue

    let quality = 1
    for (const param of params) {
      const [key, value] = param.trim().split("=")
      if (key === "q" && value) {
        const parsed = Number.parseFloat(value)
        if (!Number.isNaN(parsed)) quality = parsed
      }
    }

    types.set(type, quality)
  }

  return types
}

export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false

  const types = parseAcceptHeader(accept)
  const markdown = types.get("text/markdown") ?? 0
  const html = types.get("text/html") ?? 0
  const wildcard = types.get("*/*") ?? 0

  if (markdown === 0) return false

  const bestAlternative = Math.max(html, wildcard)
  return (
    markdown > bestAlternative ||
    (markdown === bestAlternative && bestAlternative > 0)
  )
}
