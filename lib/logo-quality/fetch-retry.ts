export type FetchRetryOptions = {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  timeoutMs?: number
  sleep?: (ms: number) => Promise<void>
  random?: () => number
}

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_BASE_DELAY_MS = 400
const DEFAULT_MAX_DELAY_MS = 4_000
const DEFAULT_TIMEOUT_MS = 20_000

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isTransientHttpStatus(status: number): boolean {
  return status === 429 || status >= 500
}

export function isTransientFetchFailure(status: number | null, error: unknown): boolean {
  if (error !== null && error !== undefined) {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        return true
      }
      const message = error.message.toLowerCase()
      if (
        message.includes("fetch failed") ||
        message.includes("network") ||
        message.includes("econnreset") ||
        message.includes("etimedout") ||
        message.includes("socket")
      ) {
        return true
      }
    }
    return true
  }
  if (status === null) return true
  return isTransientHttpStatus(status)
}

export function computeRetryDelayMs(
  attemptIndex: number,
  options: Pick<FetchRetryOptions, "baseDelayMs" | "maxDelayMs" | "random">,
): number {
  const base = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS
  const max = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS
  const random = options.random ?? Math.random
  const exponential = Math.min(max, base * 2 ** attemptIndex)
  const jitter = 0.5 + random() * 0.5
  return Math.round(exponential * jitter)
}

export async function fetchWithRetry(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit = {},
  options: FetchRetryOptions = {},
): Promise<Response> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const sleep = options.sleep ?? defaultSleep

  let lastError: unknown = null
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetchImpl(url, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(timeoutMs),
      })
      lastResponse = response
      if (!isTransientHttpStatus(response.status)) {
        return response
      }
      lastError = null
    } catch (error) {
      lastError = error
      lastResponse = null
    }

    const status = lastResponse?.status ?? null
    if (!isTransientFetchFailure(status, lastError)) {
      if (lastResponse) return lastResponse
      throw lastError instanceof Error ? lastError : new Error(String(lastError))
    }

    if (attempt < maxAttempts - 1) {
      await sleep(computeRetryDelayMs(attempt, options))
    }
  }

  if (lastResponse) return lastResponse
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

export function wrapFetchWithRetry(
  fetchImpl: typeof fetch,
  options: FetchRetryOptions = {},
): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    return fetchWithRetry(fetchImpl, url, init ?? {}, options)
  }
}
