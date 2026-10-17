export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "")
}

export function hostnameFromDomain(domain: string): string {
  return normalizeHostname(domain.split("/")[0]!)
}

export function registrableDomain(hostname: string): string {
  const host = normalizeHostname(hostname)
  const parts = host.split(".")
  if (parts.length <= 2) return host
  const tld = parts.at(-1)!
  const sld = parts.at(-2)!
  if (tld.length === 2 && sld.length <= 3 && parts.length >= 3) {
    return parts.slice(-3).join(".")
  }
  return parts.slice(-2).join(".")
}

export function domainsEquivalent(a: string, b: string): boolean {
  return registrableDomain(a) === registrableDomain(b)
}

export async function resolveSiteHostname(
  domain: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ finalHost: string; status: number } | { error: string }> {
  const url = domain.startsWith("http") ? domain : `https://${domain}`
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent": "LogosArgentina-LogoCheck/1.0",
      },
    })
    const finalHost = normalizeHostname(new URL(response.url).hostname)
    return { finalHost, status: response.status }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
