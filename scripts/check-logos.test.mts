import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import test from "node:test"
import sharp from "sharp"
import { evaluateLogoBytes, checkEntityLogo, checkEntityLogos } from "../lib/logo-quality/check.ts"
import { measureImage } from "../lib/logo-quality/image-metrics.ts"
import { domainsEquivalent, normalizeHostname } from "../lib/logo-quality/domain.ts"
import { GENERIC_FAVICON_SHA256, MIN_LOGO_BYTES } from "../lib/logo-quality/constants.ts"
import {
  analyzeLogoVisual,
  computeDHash,
  evaluateVisualAnalysis,
  hammingDistance,
} from "../lib/logo-quality/visual-analysis.ts"
import {
  collectChangedSlugsFromPatch,
  isBlockingFailure,
  slugFromHostedLogoPath,
} from "../lib/logo-quality/changed-entities.ts"
import {
  computeRetryDelayMs,
  fetchWithRetry,
  isTransientFetchFailure,
  isTransientHttpStatus,
} from "../lib/logo-quality/fetch-retry.ts"
import { getAllEntities } from "../lib/entity-index.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, "../lib/logo-quality/fixtures")

function pngBuffer(width: number, height: number, fill = 0xff): Uint8Array {
  const rowSize = width * 3 + 1
  const imageData = new Uint8Array(rowSize * height)
  for (let i = 0; i < imageData.length; i += rowSize) {
    imageData[i] = 0
    for (let c = 1; c < rowSize; c++) {
      imageData[i + c] = fill
    }
  }

  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = new Uint8Array(25)
  ihdr[0] = 0
  ihdr[1] = 0
  ihdr[2] = 0
  ihdr[3] = 13
  ihdr[4] = 0x49
  ihdr[5] = 0x48
  ihdr[6] = 0x44
  ihdr[7] = 0x52
  const view = new DataView(ihdr.buffer)
  view.setUint32(8, width, false)
  view.setUint32(12, height, false)
  ihdr[16] = 8
  ihdr[17] = 2
  ihdr[18] = 0
  ihdr[19] = 0
  ihdr[20] = 0

  const crc = Uint8Array.from([0, 0, 0, 0])
  const iend = Uint8Array.from([
    0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])

  const out = new Uint8Array(
    signature.length + ihdr.length + imageData.length + crc.length + iend.length,
  )
  let offset = 0
  out.set(signature, offset)
  offset += signature.length
  out.set(ihdr, offset)
  offset += ihdr.length
  out.set(imageData, offset)
  offset += imageData.length
  out.set(crc, offset)
  offset += crc.length
  out.set(iend, offset)
  return out
}

test("measureImage reads PNG dimensions", () => {
  const bytes = pngBuffer(128, 64)
  const metrics = measureImage(bytes)
  assert.equal(metrics.format, "png")
  assert.equal(metrics.width, 128)
  assert.equal(metrics.height, 64)
})

test("evaluateLogoBytes flags small payloads", () => {
  const tiny = new Uint8Array(100)
  const { issues } = evaluateLogoBytes(tiny, new Map(), "a", "a.com")
  assert.ok(issues.some((issue) => issue.code === "too-small-bytes"))
})

test("evaluateLogoBytes flags duplicate hash", () => {
  const bytes = new Uint8Array(MIN_LOGO_BYTES + 10).fill(7)
  const map = new Map<string, string[]>([["deadbeef".repeat(4), ["other-brand"]]])
  const sha = evaluateLogoBytes(bytes, map, "brand-a", "a.com")
  const hash = sha.metrics.sha256
  map.set(hash, [{ slug: "other-brand", domain: "other.com" }])
  const { issues } = evaluateLogoBytes(bytes, map, "brand-b", "b.com")
  assert.ok(issues.some((issue) => issue.code === "duplicate-hash"))
})

test("evaluateLogoBytes flags generic icon hash", () => {
  const bytes = new Uint8Array(MIN_LOGO_BYTES + 10).fill(1)
  const hash = createHash("sha256").update(bytes).digest("hex")
  GENERIC_FAVICON_SHA256.add(hash)
  const { issues } = evaluateLogoBytes(bytes, new Map(), "x", "x.com")
  GENERIC_FAVICON_SHA256.delete(hash)
  assert.ok(issues.some((issue) => issue.code === "generic-icon"))
})

test("domainsEquivalent treats www as equivalent", () => {
  assert.ok(domainsEquivalent("www.galicia.ar", "galicia.ar"))
  assert.ok(!domainsEquivalent("personal.com.ar", "telecom.com.ar"))
})

test("normalizeHostname strips www", () => {
  assert.equal(normalizeHostname("WWW.Example.COM"), "example.com")
})

test("checkEntityLogo uses local public file", async () => {
  const big = new Uint8Array(MIN_LOGO_BYTES + 50).fill(9)
  const result = await checkEntityLogo(
    {
      id: 1,
      name: "Test",
      domain: "example.com",
      slug: "test",
      logoUrl: "/logos/test-hosted.png",
    },
    new Map(),
    [],
    {
      skipRedirectCheck: true,
      skipVisualCheck: true,
      readFileImpl: async () => Buffer.from(big),
      fetchImpl: async () => {
        throw new Error("should not fetch")
      },
    },
  )
  assert.equal(result.ok, true)
})

test("visual analysis flags mostly transparent logo as blank", async () => {
  const blank = await sharp({
    create: {
      width: 128,
      height: 128,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer()
  const analysis = await analyzeLogoVisual(new Uint8Array(blank))
  assert.ok(analysis)
  const issues = evaluateVisualAnalysis(analysis!)
  assert.ok(issues.some((issue) => issue.code === "blank-or-faint"))
})

test("visual analysis flags wide photo-like asset", () => {
  const issues = evaluateVisualAnalysis({
    width: 800,
    height: 280,
    contentWidth: 800,
    contentHeight: 280,
    aspectRatio: 2.86,
    opaqueRatio: 0.92,
    contentFillRatio: 0.95,
    contrastSpread: 120,
    variance: 2400,
    uniqueColors: 220,
    meanLuminance: 128,
    dHash: 0n,
  })
  assert.ok(issues.some((issue) => issue.code === "photo-or-screenshot"))
})

test("must-fail fixtures: Accord Salud and Trapiche white logos", async () => {
  for (const file of ["must-fail-accord-salud.png", "must-fail-trapiche-white.png"]) {
    const bytes = await readFile(path.join(fixturesDir, file))
    const onWhite = await sharp(bytes).flatten({ background: "#ffffff" }).png().toBuffer()
    const analysis = await analyzeLogoVisual(new Uint8Array(onWhite))
    assert.ok(analysis)
    const { evaluateInvisibleOnLightBackground } = await import(
      "../lib/logo-quality/visual-analysis.ts"
    )
    const issues = evaluateInvisibleOnLightBackground(analysis!)
    assert.ok(
      issues.some((issue) => issue.code === "blank-or-faint"),
      `expected blank-or-faint for ${file}, got: ${issues.map((i) => i.message).join("; ")}`,
    )
  }
})

test("dHash is stable across minor resize (perceptual match)", async () => {
  const sample = await readFile(path.join(fixturesDir, "sample-wordmark.png"))
  const resized = await sharp(sample).resize(200, 200).png().toBuffer()
  const a = await computeDHash(new Uint8Array(sample))
  const b = await computeDHash(new Uint8Array(resized))
  assert.ok(hammingDistance(a, b) <= 5)
})

test("checkEntityLogos flags near-duplicate perceptual hash across brands", async () => {
  const shield = await readFile(path.join(fixturesDir, "gov-shield-senasa.png"))
  const entity = (slug: string, domain: string, id: number) => ({
    id,
    name: slug,
    domain,
    slug,
    logoUrl: "/fixtures/shield.png",
    logoSource: "hosted" as const,
  })
  const results = await checkEntityLogos(
    [entity("senasa", "senasa.gob.ar", 500), entity("renaper", "renaper.gob.ar", 501)],
    {
      skipRedirectCheck: true,
      publicDir: path.join(__dirname, "../public"),
      readFileImpl: async () => Buffer.from(shield),
    },
  )
  const duplicateIssues = results[1]?.issues.map((issue) => issue.code) ?? []
  assert.ok(
    duplicateIssues.includes("near-duplicate-visual") ||
      duplicateIssues.includes("duplicate-hash"),
  )
})

test("isTransientHttpStatus treats 429 and 5xx as transient", () => {
  assert.equal(isTransientHttpStatus(429), true)
  assert.equal(isTransientHttpStatus(503), true)
  assert.equal(isTransientHttpStatus(404), false)
})

test("isTransientFetchFailure skips consistent 404", () => {
  assert.equal(isTransientFetchFailure(404, null), false)
  assert.equal(isTransientFetchFailure(503, null), true)
  assert.equal(isTransientFetchFailure(null, new TypeError("fetch failed")), true)
})

test("computeRetryDelayMs stays within bounds with fixed random", () => {
  const delay = computeRetryDelayMs(2, {
    baseDelayMs: 100,
    maxDelayMs: 500,
    random: () => 0,
  })
  assert.equal(delay, 200)
})

test("fetchWithRetry retries transient 503 then succeeds", async () => {
  let calls = 0
  const fetchImpl = async () => {
    calls++
    if (calls < 3) {
      return new Response("error", { status: 503 })
    }
    return new Response(new Uint8Array([1, 2, 3]), { status: 200 })
  }
  const response = await fetchWithRetry(fetchImpl as typeof fetch, "https://example.com/x", {}, {
    sleep: async () => {},
    random: () => 0,
  })
  assert.equal(response.status, 200)
  assert.equal(calls, 3)
})

test("fetchWithRetry does not retry 404", async () => {
  let calls = 0
  const fetchImpl = async () => {
    calls++
    return new Response("missing", { status: 404 })
  }
  const response = await fetchWithRetry(fetchImpl as typeof fetch, "https://example.com/x", {}, {
    sleep: async () => {
      throw new Error("should not sleep")
    },
  })
  assert.equal(response.status, 404)
  assert.equal(calls, 1)
})

test("slugFromHostedLogoPath extracts slug", () => {
  assert.equal(slugFromHostedLogoPath("public/logos/mercado-pago.png"), "mercado-pago")
  assert.equal(slugFromHostedLogoPath("lib/logos-data.ts"), null)
})

test("collectChangedSlugsFromPatch maps ids, domains, and hosted paths", () => {
  const entities = getAllEntities()
  const galicia = entities.find((entity) => entity.id === 4)
  assert.ok(galicia)
  const patch = [
    `+      { id: ${galicia!.id}, name: "Banco Galicia", domain: "www.galicia.ar" },`,
    `+    "naranjax.com": {`,
    `+      "logoUrl": "/logos/naranja-x.png",`,
  ].join("\n")
  const slugs = collectChangedSlugsFromPatch(patch, entities)
  assert.ok(slugs.has(galicia!.slug))
  assert.ok(slugs.has("naranja-x"))
})

test("collectChangedSlugsFromPatch maps in-place logoUrl override edits", () => {
  const entities = getAllEntities()
  const naranja = entities.find((entity) => entity.domain === "naranjax.com")
  assert.ok(naranja)
  const patch = [
    '   "naranjax.com": {',
    '-    "logoUrl": "https://old.example/logo.png",',
    '+    "logoUrl": "https://new.example/logo.png",',
  ].join("\n")
  const slugs = collectChangedSlugsFromPatch(patch, entities)
  assert.ok(slugs.has(naranja!.slug))
})

test("fetchWithRetry applies a fresh timeout signal on each attempt", async () => {
  let calls = 0
  const fetchImpl = async (_url: string, init?: RequestInit) => {
    calls++
    assert.equal(init?.signal?.aborted, false)
    if (calls === 1) {
      throw new DOMException("The operation was aborted.", "TimeoutError")
    }
    return new Response("ok", { status: 200 })
  }
  const response = await fetchWithRetry(
    fetchImpl as typeof fetch,
    "https://example.com/x",
    { signal: AbortSignal.timeout(1) },
    { sleep: async () => {} },
  )
  assert.equal(response.status, 200)
  assert.equal(calls, 2)
})

test("isBlockingFailure respects PR-scoped slug set", () => {
  const blocking = new Set(["mercado-pago"])
  assert.equal(isBlockingFailure("mercado-pago", blocking), true)
  assert.equal(isBlockingFailure("la-caja-seguros", blocking), false)
  assert.equal(isBlockingFailure("la-caja-seguros", null), true)
})

test("checkEntityLogos uses retrying fetch on transient network errors", async () => {
  let calls = 0
  const pngBytes = await sharp({
    create: { width: 512, height: 512, channels: 3, background: "#336699" },
  })
    .png()
    .toBuffer()
  assert.ok(pngBytes.length >= MIN_LOGO_BYTES)

  const fetchImpl = async () => {
    calls++
    if (calls === 1) {
      throw new TypeError("fetch failed")
    }
    return new Response(pngBytes, {
      status: 200,
      headers: { "content-type": "image/png" },
    })
  }

  const result = await checkEntityLogo(
    {
      id: 9001,
      name: "Retry Test",
      domain: "retry-test.example",
      slug: "retry-test",
      logoUrl: "https://retry-test.example/logo.png",
    },
    new Map(),
    [],
    {
      skipRedirectCheck: true,
      skipVisualCheck: true,
      fetchImpl: fetchImpl as typeof fetch,
      fetchRetry: { sleep: async () => {} },
    },
  )
  assert.equal(calls, 2)
  assert.equal(result.ok, true)
})
