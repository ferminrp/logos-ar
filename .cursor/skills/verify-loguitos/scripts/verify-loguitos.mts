import { spawn, type ChildProcess } from "node:child_process"
import {
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises"
import { createWriteStream } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, "../../../..")

const MAX_ENTITY_TITLE_LENGTH = 60

function extractDocumentTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match ? match[1].trim() : null
}

function assertCompactEntityTitle(title: string, slug: string): void {
  if (!title.includes("| Loguitos")) {
    throw new Error(`missing Loguitos suffix in document title for ${slug}`)
  }
  if (title.includes("…")) {
    throw new Error(`title for ${slug} contains ellipsis`)
  }
  if (title.length > MAX_ENTITY_TITLE_LENGTH) {
    throw new Error(
      `title for ${slug} exceeds ${MAX_ENTITY_TITLE_LENGTH}: ${title.length} (${title})`,
    )
  }
}

type DoctorCheck = {
  name: string
  ok: boolean
  detail: string
}

type ServerRecord = {
  runId: string
  pid: number
  port: number
  baseUrl: string
  logPath: string
  startedAt: string
}

function envPort(): number {
  const raw = process.env.VERIFY_LOGUITOS_PORT ?? "3100"
  const port = Number.parseInt(raw, 10)
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid VERIFY_LOGUITOS_PORT: ${raw}`)
  }
  return port
}

function baseUrlFromEnv(port: number): string {
  const explicit = process.env.VERIFY_LOGUITOS_BASE_URL?.replace(/\/$/, "")
  if (explicit) return explicit
  return `http://127.0.0.1:${port}`
}

function runId(): string {
  return process.env.VERIFY_LOGUITOS_RUN_ID ?? new Date().toISOString().replace(/[:.]/g, "-")
}

function runsDir(run: string): string {
  return path.join(REPO_ROOT, ".verify-loguitos", "runs", run)
}

function artifactsDir(run: string): string {
  return path.join(REPO_ROOT, ".verify-loguitos", "artifacts", run)
}

function latestRunFile(): string {
  return path.join(REPO_ROOT, ".verify-loguitos", "runs", "latest", "server.json")
}

async function readServerRecord(): Promise<ServerRecord | null> {
  try {
    const raw = await readFile(latestRunFile(), "utf8")
    return JSON.parse(raw) as ServerRecord
  } catch {
    return null
  }
}

async function writeServerRecord(record: ServerRecord): Promise<void> {
  const dir = path.dirname(latestRunFile())
  const runDir = runsDir(record.runId)
  const payload = JSON.stringify(record, null, 2)
  await Promise.all([
    (async () => {
      await mkdir(dir, { recursive: true })
      await writeFile(latestRunFile(), payload)
    })(),
    (async () => {
      await mkdir(runDir, { recursive: true })
      await writeFile(path.join(runDir, "server.json"), payload)
    })(),
  ])
}

function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? REPO_ROOT,
      env: { ...process.env, ...options.env },
      stdio: "inherit",
      shell: false,
    })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`))
    })
  })
}

async function waitForHttpOk(
  url: string,
  options: {
    attempts?: number
    delayMs?: number
    child?: ChildProcess | null
    bodyIncludes?: string
  } = {}
): Promise<void> {
  const { attempts = 60, delayMs = 1000, child, bodyIncludes } = options
  let lastError = "unknown"
  for (let i = 0; i < attempts; i++) {
    if (child && child.exitCode !== null) {
      throw new Error(`Server process exited with code ${child.exitCode} before ${url} was ready`)
    }
    try {
      const res = await fetch(url, { redirect: "follow" })
      if (res.ok) {
        const text = await res.text()
        if (text.length === 0) {
          lastError = "empty body"
        } else if (bodyIncludes && !text.includes(bodyIncludes)) {
          lastError = `body missing "${bodyIncludes}"`
        } else {
          return
        }
      } else {
        lastError = `status ${res.status}`
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await new Promise((r) => setTimeout(r, delayMs))
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`)
}

async function resolveArtifactRunId(): Promise<string> {
  return (
    process.env.VERIFY_LOGUITOS_RUN_ID ??
    (await readServerRecord())?.runId ??
    runId()
  )
}

let launchedChild: ChildProcess | null = null

async function launch(): Promise<ServerRecord> {
  const existing = await readServerRecord()
  if (existing && process.env.VERIFY_LOGUITOS_BASE_URL) {
    console.log(`Using VERIFY_LOGUITOS_BASE_URL=${process.env.VERIFY_LOGUITOS_BASE_URL} (skip launch)`)
    return existing
  }

  const run = runId()
  const port = envPort()
  const baseUrl = baseUrlFromEnv(port)
  const runDir = runsDir(run)
  const logPath = path.join(runDir, "server.log")
  await mkdir(runDir, { recursive: true })

  console.log("Running pnpm build…")
  await runCommand("pnpm", ["build"], { cwd: REPO_ROOT })

  console.log(`Starting next start on port ${port}…`)
  const logStream = createWriteStream(logPath)
  launchedChild = spawn(
    "pnpm",
    ["exec", "next", "start", "-p", String(port)],
    {
      cwd: REPO_ROOT,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    }
  )
  launchedChild.stdout?.pipe(logStream)
  launchedChild.stderr?.pipe(logStream)

  if (!launchedChild.pid) {
    throw new Error("Failed to start next server")
  }

  const record: ServerRecord = {
    runId: run,
    pid: launchedChild.pid,
    port,
    baseUrl,
    logPath,
    startedAt: new Date().toISOString(),
  }
  await writeServerRecord(record)
  process.env.VERIFY_LOGUITOS_RUN_ID = run

  const localUrl = `http://127.0.0.1:${port}`
  await waitForHttpOk(`${localUrl}/`, {
    child: launchedChild,
    bodyIncludes: "Logos Argentina",
  })
  console.log(`Server ready at ${baseUrl} (pid ${record.pid})`)
  return record
}

async function resolveBaseUrl(): Promise<string> {
  const fromEnv = process.env.VERIFY_LOGUITOS_BASE_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv
  const record = await readServerRecord()
  if (record) return record.baseUrl
  return baseUrlFromEnv(envPort())
}

async function doctor(): Promise<DoctorCheck[]> {
  const baseUrl = await resolveBaseUrl()

  async function check(
    name: string,
    url: string,
    assertFn?: (res: Response, body: string) => void
  ): Promise<DoctorCheck> {
    try {
      const res = await fetch(url)
      const body = await res.text()
      if (!res.ok) {
        return { name, ok: false, detail: `HTTP ${res.status}` }
      }
      assertFn?.(res, body)
      return { name, ok: true, detail: `HTTP ${res.status}` }
    } catch (error) {
      return {
        name,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async function checkPermanentRedirect(
    name: string,
    sourcePath: string,
    destinationPath: string
  ): Promise<DoctorCheck> {
    try {
      const res = await fetch(`${baseUrl}${sourcePath}`, { redirect: "manual" })
      const location = res.headers.get("location") ?? ""
      const okStatus = res.status === 301 || res.status === 308
      const okLocation =
        location === destinationPath ||
        location.endsWith(destinationPath)
      if (!okStatus || !okLocation) {
        return {
          name,
          ok: false,
          detail: `HTTP ${res.status} location=${location || "(none)"}`,
        }
      }
      return {
        name,
        ok: true,
        detail: `HTTP ${res.status} → ${destinationPath}`,
      }
    } catch (error) {
      return {
        name,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async function checkApiGalicia(): Promise<DoctorCheck> {
    const name = "api-galicia"
    try {
      const apiUrl = `${baseUrl}/api/logos?q=galicia&limit=5`
      const res = await fetch(apiUrl)
      if (!res.ok) {
        return { name, ok: false, detail: `HTTP ${res.status}` }
      }
      const json = (await res.json()) as {
        items?: Array<{ name?: string; domain?: string }>
      }
      const items = json.items ?? []
      const match = items.some(
        (item) =>
          item.name?.toLowerCase().includes("galicia") ||
          item.domain?.toLowerCase().includes("galicia")
      )
      if (!match) {
        return { name, ok: false, detail: "no galicia match in items" }
      }
      return { name, ok: true, detail: `HTTP ${res.status}` }
    } catch (error) {
      return {
        name,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async function checkApiGscAliasMeli(): Promise<DoctorCheck> {
    const name = "api-gsc-alias-meli"
    try {
      const apiUrl = `${baseUrl}/api/logos?q=meli&limit=5`
      const res = await fetch(apiUrl)
      if (!res.ok) {
        return { name, ok: false, detail: `HTTP ${res.status}` }
      }
      const json = (await res.json()) as {
        items?: Array<{ name?: string; domain?: string }>
      }
      const items = json.items ?? []
      const match = items.some(
        (item) =>
          item.name?.toLowerCase().includes("mercado libre") ||
          item.domain?.toLowerCase().includes("mercadolibre"),
      )
      if (!match) {
        return { name, ok: false, detail: "no Mercado Libre match for q=meli" }
      }
      return { name, ok: true, detail: `HTTP ${res.status}` }
    } catch (error) {
      return {
        name,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  }

  const checks = await Promise.all([
    check("home", `${baseUrl}/`, (_res, body) => {
      if (!body.includes("Logos Argentina")) {
        throw new Error('missing "Logos Argentina" in HTML')
      }
    }),
    check("docs", `${baseUrl}/docs`, (_res, body) => {
      if (!body.includes("API de logos")) {
        throw new Error('missing "API de logos"')
      }
    }),
    check("robots", `${baseUrl}/robots.txt`),
    check("category-bancos-seo", `${baseUrl}/categoria/bancos`, (_res, body) => {
      if (!body.includes("Logos de bancos argentinos")) {
        throw new Error('missing category SEO h1 "Logos de bancos argentinos"')
      }
      if (!body.includes("Directorio de logos de bancos tradicionales")) {
        throw new Error("missing bancos introLead from lib/category-seo.ts")
      }
    }),
    check("logo-banco-provincia-meta", `${baseUrl}/logo/banco-provincia`, (_res, body) => {
      if (!body.includes("Descargá el logo de Banco Provincia")) {
        throw new Error("missing entity meta description from lib/entity-seo.ts")
      }
      const title = extractDocumentTitle(body)
      if (!title) {
        throw new Error("missing document title")
      }
      assertCompactEntityTitle(title, "banco-provincia")
    }),
    check("entity-title-compact", `${baseUrl}/logo/banco-de-la-nacion-argentina`, (_res, body) => {
      const title = extractDocumentTitle(body)
      if (!title) {
        throw new Error("missing document title")
      }
      assertCompactEntityTitle(title, "banco-de-la-nacion-argentina")
    }),
    check("logo-changan", `${baseUrl}/logo/changan`, (_res, body) => {
      if (!body.includes("Changan")) {
        throw new Error('missing "Changan" on GSC brand page')
      }
    }),
    checkPermanentRedirect(
      "redirect-categoria-delivery",
      "/categoria/delivery",
      "/categoria/gastronomia"
    ),
    checkPermanentRedirect(
      "redirect-logo-banco-provincia-alias",
      "/logo/banco-provincia-bs-as",
      "/logo/banco-provincia"
    ),
    checkPermanentRedirect(
      "redirect-logo-tn-alias",
      "/logo/tn-todo-noticias",
      "/logo/tn"
    ),
    checkApiGalicia(),
    checkApiGscAliasMeli(),
  ])

  const run = await resolveArtifactRunId()
  const outDir = artifactsDir(run)
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, "doctor.json"), JSON.stringify({ baseUrl, checks }, null, 2))

  const failed = checks.filter((c) => !c.ok)
  for (const c of checks) {
    console.log(`${c.ok ? "OK" : "FAIL"} ${c.name}: ${c.detail}`)
  }
  if (failed.length > 0) {
    throw new Error(`Doctor failed (${failed.length} checks)`)
  }
  return checks
}

async function drive(): Promise<void> {
  const baseUrl = await resolveBaseUrl()
  const run = await resolveArtifactRunId()
  const outDir = artifactsDir(run)
  await mkdir(outDir, { recursive: true })

  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  const lines: string[] = [`drive baseUrl=${baseUrl}`, `runId=${run}`]

  try {
    const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await desktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" })
    await desktop.screenshot({ path: path.join(outDir, "home-desktop.png"), fullPage: false })
    lines.push("home-desktop.png captured")

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await mobile.goto(`${baseUrl}/?q=galicia`, { waitUntil: "domcontentloaded" })
    await mobile.getByText('Resultados para "galicia"').waitFor({ timeout: 15000 })
    await mobile.screenshot({ path: path.join(outDir, "home-search-mobile.png"), fullPage: false })
    lines.push("home-search-mobile.png captured (feature: home-search)")

    await desktop.goto(`${baseUrl}/logo/banco-galicia`, { waitUntil: "domcontentloaded" })
    await desktop.getByRole("heading", { name: /Logo Banco Galicia/ }).waitFor({ timeout: 15000 })
    await desktop.screenshot({ path: path.join(outDir, "logo-detail-desktop.png"), fullPage: false })
    lines.push("logo-detail-desktop.png captured (feature: logo-detail)")

    await desktop.goto(`${baseUrl}/categoria/bancos`, { waitUntil: "domcontentloaded" })
    await desktop
      .getByRole("heading", { level: 1, name: "Logos de bancos argentinos" })
      .waitFor({ timeout: 15000 })
    await desktop.screenshot({
      path: path.join(outDir, "category-bancos-seo-desktop.png"),
      fullPage: false,
    })
    lines.push("category-bancos-seo-desktop.png captured (feature: seo-ctr)")
  } finally {
    await browser.close()
  }

  await writeFile(path.join(outDir, "drive-summary.txt"), lines.join("\n") + "\n")
  const latestArtifacts = path.join(REPO_ROOT, ".verify-loguitos", "artifacts", "latest")
  await rm(latestArtifacts, { recursive: true, force: true })
  await symlink(outDir, latestArtifacts, "dir")
  console.log(`Artifacts written to ${outDir}`)
}

async function cleanup(): Promise<void> {
  const record = await readServerRecord()
  if (!record) {
    console.log("No server record; cleanup noop")
    return
  }

  const kill = (pid: number) => {
    try {
      process.kill(pid, "SIGTERM")
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== "ESRCH") throw error
    }
  }

  kill(record.pid)
  if (launchedChild && !launchedChild.killed) {
    launchedChild.kill("SIGTERM")
  }

  await new Promise((r) => setTimeout(r, 500))
  console.log(`Stopped server pid ${record.pid} (port ${record.port})`)
}

async function all(): Promise<void> {
  const external = Boolean(process.env.VERIFY_LOGUITOS_BASE_URL)
  let launchedThisRun = false
  try {
    if (external) {
      if (!process.env.VERIFY_LOGUITOS_RUN_ID) {
        process.env.VERIFY_LOGUITOS_RUN_ID = await resolveArtifactRunId()
      }
    } else {
      const record = await launch()
      process.env.VERIFY_LOGUITOS_RUN_ID = record.runId
      launchedThisRun = true
    }
    await doctor()
    await drive()
  } finally {
    if (!external && launchedThisRun) {
      await cleanup()
    }
  }
  const run = await resolveArtifactRunId()
  const artifactPath = artifactsDir(run)
  const doctorPath = path.join(artifactPath, "doctor.json")
  try {
    await readFile(doctorPath)
    console.log(`Proof artifacts retained at ${artifactPath}`)
  } catch {
    throw new Error("Evidence missing after cleanup")
  }
}

const command = process.argv[2] ?? "all"

async function main(): Promise<void> {
  switch (command) {
    case "launch":
      await launch()
      break
    case "doctor":
      await doctor()
      break
    case "drive":
      await drive()
      break
    case "cleanup":
      await cleanup()
      break
    case "all":
      await all()
      break
    default:
      console.error(`Unknown command: ${command}`)
      process.exitCode = 1
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error)
  if (launchedChild) {
    if (launchedChild.exitCode === null) {
      launchedChild.kill("SIGTERM")
    }
    try {
      await cleanup()
    } catch {
      // best-effort shutdown on failure
    }
  }
  process.exit(1)
})
