import overridesJson from "../data/logo-overrides.json" with { type: "json" }
import manualFixesJson from "../data/logo-manual-fixes.json" with { type: "json" }
import type { LogoSourceKind } from "./logos-data.ts"

export type LogoOverride = {
  logoUrl: string
  logoSource: LogoSourceKind
}

const mergedOverrides = {
  ...(overridesJson as Record<string, LogoOverride>),
  ...(manualFixesJson as Record<string, LogoOverride>),
}

const overridesByDomain = new Map<string, LogoOverride>(
  Object.entries(mergedOverrides).map(([domain, value]) => [domain.toLowerCase(), value]),
)

export function getLogoOverride(domain: string): LogoOverride | null {
  return overridesByDomain.get(domain.toLowerCase()) ?? null
}
