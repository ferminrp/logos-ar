import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Entity } from "../logos-data.ts"
import { getEntityLogoUrl } from "../entity-logo.ts"
import {
  GENERIC_FAVICON_SHA256,
  GOOGLE_FAVICON_CHECK_SIZE,
  MIN_LOGO_BYTES,
  MIN_LOGO_PX,
  REDIRECT_BOT_WALL_HOST_FRAGMENTS,
  REDIRECT_BRAND_MISMATCH,
} from "./constants.ts"
import {
  domainsEquivalent,
  hostnameFromDomain,
  resolveSiteHostname,
} from "./domain.ts"
import { measureImage } from "./image-metrics.ts"

export type LogoCheckCode =
  | "fetch-failed"
  | "too-small-bytes"
  | "too-small-dimensions"
  | "duplicate-hash"
  | "generic-icon"
  | "redirect-mismatch"
  | "site-unreachable"

export type LogoCheckIssue = {
  code: LogoCheckCode
  message: string
}

export type LogoMetrics = {
  bytes: number
  width: number
  height: number
  sha256: string
  contentType: string | null
}

export type EntityLogoInput = Pick<Entity, "id" | "name" | "domain" | "logoUrl" | "logoSource"> & {
  slug: string
}

export type LogoCheckResult = {
  slug: string
  name: string
  domain: string
  logoUrl: string
  ok: boolean
  issues: LogoCheckIssue[]
  metrics?: LogoMetrics
}

export type CheckCatalogOptions = {
  fetchImpl?: typeof fetch
  readFileImpl?: typeof readFile
  publicDir?: string
  skipRedirectCheck?: boolean
  concurrency?: number
}

async function loadLogoBytes(
  logoUrl: string,
  options: CheckCatalogOptions,
): Promise<{ bytes: Uint8Array; contentType: string | null; status: number }> {
  const fetchImpl = options.fetchImpl ?? fetch
  const readFileImpl = options.readFileImpl ?? readFile

  if (logoUrl.startsWith("/")) {
    const publicDir = options.publicDir ?? path.join(process.cwd(), "public")
    const filePath = path.join(publicDir, logoUrl.replace(/^\//, ""))
    const buffer = await readFileImpl(filePath)
    return { bytes: new Uint8Array(buffer), contentType: null, status: 200 }
  }

  const response = await fetchImpl(logoUrl, {
    headers: { "User-Agent": "LogosArgentina-LogoCheck/1.0" },
    signal: AbortSignal.timeout(20_000),
  })
  const arrayBuffer = await response.arrayBuffer()
  return {
    bytes: new Uint8Array(arrayBuffer),
    contentType: response.headers.get("content-type"),
    status: response.status,
  }
}

type HashOwner = { slug: string; domain: string }

export function evaluateLogoBytes(
  bytes: Uint8Array,
  sha256ToOwners: Map<string, HashOwner[]>,
  slug: string,
  domain: string,
): { issues: LogoCheckIssue[]; metrics: LogoMetrics } {
  const sha256 = createHash("sha256").update(bytes).digest("hex")
  const { width, height, format } = measureImage(bytes)
  const metrics: LogoMetrics = {
    bytes: bytes.length,
    width,
    height,
    sha256,
    contentType: null,
  }

  const issues: LogoCheckIssue[] = []

  if (bytes.length < MIN_LOGO_BYTES) {
    issues.push({
      code: "too-small-bytes",
      message: `Logo pesa ${bytes.length} B (mínimo ${MIN_LOGO_BYTES} B)`,
    })
  }

  const maxDim = Math.max(width, height)
  if (format === "unknown" && bytes.length >= MIN_LOGO_BYTES) {
    const preview = new TextDecoder("utf-8", { fatal: false })
      .decode(bytes.slice(0, 256))
      .trimStart()
    if (preview.startsWith("<")) {
      issues.push({
        code: "too-small-dimensions",
        message: "La URL del logo no devuelve una imagen válida",
      })
    }
  } else if (maxDim > 0 && maxDim < MIN_LOGO_PX) {
    issues.push({
      code: "too-small-dimensions",
      message: `Logo ${width}×${height}px (mínimo ${MIN_LOGO_PX}px)`,
    })
  }

  if (GENERIC_FAVICON_SHA256.has(sha256)) {
    issues.push({
      code: "generic-icon",
      message: "Favicon genérico (placeholder de Google)",
    })
  }

  const owners = sha256ToOwners.get(sha256) ?? []
  const otherBrand = owners.find(
    (owner) =>
      owner.slug !== slug &&
      !domainsEquivalent(owner.domain, domain),
  )
  if (otherBrand) {
    issues.push({
      code: "duplicate-hash",
      message: `Mismo logo que ${otherBrand.slug}`,
    })
  }

  return { issues, metrics }
}

export async function checkEntityLogo(
  entity: EntityLogoInput,
  sha256ToOwners: Map<string, HashOwner[]>,
  options: CheckCatalogOptions = {},
): Promise<LogoCheckResult> {
  const logoUrl = getEntityLogoUrl(entity, GOOGLE_FAVICON_CHECK_SIZE)
  const issues: LogoCheckIssue[] = []

  if (!options.skipRedirectCheck) {
    const expectedHost = hostnameFromDomain(entity.domain)
    const mismatchTarget = REDIRECT_BRAND_MISMATCH[entity.domain.toLowerCase()]
    if (mismatchTarget) {
      issues.push({
        code: "redirect-mismatch",
        message: `Dominio redirige a otra marca (${mismatchTarget})`,
      })
    } else {
      const site = await resolveSiteHostname(entity.domain, options.fetchImpl)
      if (!("error" in site) && !domainsEquivalent(site.finalHost, expectedHost)) {
        const sharedPortal =
          site.finalHost.endsWith("argentina.gob.ar") &&
          (entity.domain.includes("gob.ar") || entity.domain.includes("argentina.gob.ar"))
        const botWall = REDIRECT_BOT_WALL_HOST_FRAGMENTS.some((fragment) =>
          site.finalHost.includes(fragment),
        )
        if (!sharedPortal && !botWall) {
          issues.push({
            code: "redirect-mismatch",
            message: `Dominio redirige a ${site.finalHost} (esperado ${expectedHost})`,
          })
        }
      }
    }
  }

  try {
    const { bytes, status, contentType } = await loadLogoBytes(logoUrl, options)
    if (status !== 200) {
      issues.push({
        code: "fetch-failed",
        message: `Logo HTTP ${status} en ${logoUrl}`,
      })
      return {
        slug: entity.slug,
        name: entity.name,
        domain: entity.domain,
        logoUrl,
        ok: false,
        issues,
      }
    }

    if (contentType?.toLowerCase().includes("text/html")) {
      issues.push({
        code: "fetch-failed",
        message: `Logo HTTP responde HTML en ${logoUrl}`,
      })
      return {
        slug: entity.slug,
        name: entity.name,
        domain: entity.domain,
        logoUrl,
        ok: false,
        issues,
      }
    }

    const evaluated = evaluateLogoBytes(
      bytes,
      sha256ToOwners,
      entity.slug,
      entity.domain,
    )
    if (evaluated.metrics && contentType) {
      evaluated.metrics.contentType = contentType
    }
    const allIssues = [...issues, ...evaluated.issues]

    if (evaluated.metrics.sha256) {
      const list = sha256ToOwners.get(evaluated.metrics.sha256) ?? []
      list.push({ slug: entity.slug, domain: entity.domain })
      sha256ToOwners.set(evaluated.metrics.sha256, list)
    }

    return {
      slug: entity.slug,
      name: entity.name,
      domain: entity.domain,
      logoUrl,
      ok: allIssues.length === 0,
      issues: allIssues,
      metrics: evaluated.metrics,
    }
  } catch (error) {
    issues.push({
      code: "fetch-failed",
      message: error instanceof Error ? error.message : String(error),
    })
    return {
      slug: entity.slug,
      name: entity.name,
      domain: entity.domain,
      logoUrl,
      ok: false,
      issues,
    }
  }
}

export async function checkEntityLogos(
  entities: EntityLogoInput[],
  options: CheckCatalogOptions = {},
): Promise<LogoCheckResult[]> {
  const sha256ToOwners = new Map<string, HashOwner[]>()
  const results: LogoCheckResult[] = []

  for (const entity of entities) {
    const result = await checkEntityLogo(entity, sha256ToOwners, options)
    results.push(result)
  }

  return results
}
