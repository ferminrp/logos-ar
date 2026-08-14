export const FLAG_CDN_BASE =
  "https://catamphetamine.gitlab.io/country-flag-icons"

export type FlagRatio = "3x2" | "1x1"

export function getFlagSvgUrl(code: string, ratio: FlagRatio = "3x2"): string {
  return `${FLAG_CDN_BASE}/${ratio}/${code}.svg`
}

export function getFlagImgSnippet(
  code: string,
  name: string,
  ratio: FlagRatio = "3x2",
): string {
  const src = getFlagSvgUrl(code, ratio)
  if (ratio === "1x1") {
    return `<img src="${src}" alt="${name}" width="32" height="32" />`
  }
  return `<img src="${src}" alt="${name}" width="32" height="21" />`
}

export const FLAG_SOURCE_URL = "https://gitlab.com/catamphetamine/country-flag-icons"
export const FLAG_SOURCE_PAGES_URL = `${FLAG_CDN_BASE}/3x2`
