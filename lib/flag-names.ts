const REGIONAL_NAMES: Record<string, string> = {
  "BQ-BO": "Bonaire",
  "BQ-SA": "Saba",
  "BQ-SE": "San Eustacio",
  "ES-CT": "Cataluña",
  "GB-ENG": "Inglaterra",
  "GB-NIR": "Irlanda del Norte",
  "GB-SCT": "Escocia",
  "GB-WLS": "Gales",
}

const displayNames = new Intl.DisplayNames(["es"], { type: "region" })

export function getFlagName(code: string): string {
  const regional = REGIONAL_NAMES[code]
  if (regional) {
    return regional
  }

  try {
    const name = displayNames.of(code)
    if (name) {
      return name
    }
  } catch {
    // Intl does not support some regional codes.
  }

  return code
}
