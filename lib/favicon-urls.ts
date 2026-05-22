export interface CurlConfig {
  size: number
  outputFormat: "png" | "ico" | "original"
  includeHeaders: boolean
}

export const defaultCurlConfig: CurlConfig = {
  size: 128,
  outputFormat: "original",
  includeHeaders: false,
}

export function getGoogleFaviconUrl(domain: string, size: number = 128): string {
  return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=${size}`
}

export function getDuckDuckGoFaviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

export function getGoogleCurl(
  domain: string,
  config: CurlConfig = defaultCurlConfig
): string {
  const url = getGoogleFaviconUrl(domain, config.size)
  const ext = config.outputFormat === "original" ? "png" : config.outputFormat
  const filename = `${domain.replace(/\./g, "_")}_favicon.${ext}`
  const headers = config.includeHeaders ? " -I" : ""
  return `curl${headers} "${url}" -o ${filename}`
}

export function getDuckDuckGoCurl(
  domain: string,
  config: CurlConfig = defaultCurlConfig
): string {
  const url = getDuckDuckGoFaviconUrl(domain)
  const ext = config.outputFormat === "original" ? "ico" : config.outputFormat
  const filename = `${domain.replace(/\./g, "_")}_favicon.${ext}`
  const headers = config.includeHeaders ? " -I" : ""
  return `curl${headers} "${url}" -o ${filename}`
}

export function getSheetsImageFormula(googleUrl: string): string {
  return `=IMAGE("${googleUrl}")`
}
