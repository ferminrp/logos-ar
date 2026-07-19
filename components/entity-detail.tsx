import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { EntityPreviewCard } from "@/components/entity-preview-card"
import { LogoDownloadButtons } from "@/components/logo-download-buttons"
import type { EntityRecord } from "@/lib/entity-index"
import {
  defaultCurlConfig,
  getDuckDuckGoCurl,
  getDuckDuckGoFaviconUrl,
  getGoogleCurl,
  getGoogleFaviconUrl,
  getSheetsImageFormula,
} from "@/lib/favicon-urls"

interface EntityDetailProps {
  entity: EntityRecord
  related: EntityRecord[]
  slug: string
}

export function EntityDetail({ entity, related, slug }: EntityDetailProps) {
  const googleUrl = getGoogleFaviconUrl(entity.domain)
  const duckUrl = getDuckDuckGoFaviconUrl(entity.domain)
  const googleCurl = getGoogleCurl(entity.domain, defaultCurlConfig)
  const duckCurl = getDuckDuckGoCurl(entity.domain, defaultCurlConfig)
  const sheetsFormula = getSheetsImageFormula(googleUrl)

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Logo {entity.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Logo oficial de {entity.name} en resolución alta, formato PNG
          transparente y SVG vectorial. Descarga gratis para uso en diseño web,
          presentaciones y documentos.
        </p>
        <LogoDownloadButtons
          slug={slug}
          name={entity.name}
          domain={entity.domain}
        />
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(40,35,30,0.03)] sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
          <img
            src={googleUrl}
            alt={`Logo de ${entity.name}`}
            width={80}
            height={80}
            className="h-20 w-20 rounded-lg object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="min-w-0 flex-1">
          <a
            href={`https://${entity.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
          >
            {entity.domain}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <p className="mt-2 text-sm text-muted-foreground">
            Categoría:{" "}
            <Link
              href={`/categoria/${entity.categoryId}`}
              className="text-primary hover:underline"
            >
              {entity.categoryName}
            </Link>
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-lg font-medium tracking-tight text-foreground">URLs de favicon</h2>

        <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(40,35,30,0.03)]">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Google (128px)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-secondary px-2 py-1.5 font-mono text-xs text-foreground">
                {googleUrl}
              </code>
              <CopyButton value={googleUrl} label="Copiar URL de Google" />
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              DuckDuckGo
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-secondary px-2 py-1.5 font-mono text-xs text-foreground">
                {duckUrl}
              </code>
              <CopyButton value={duckUrl} label="Copiar URL de DuckDuckGo" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg font-medium tracking-tight text-foreground">Comandos curl</h2>
        <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(40,35,30,0.03)]">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Google</p>
            <div className="flex items-start gap-2">
              <pre className="flex-1 overflow-x-auto rounded bg-secondary p-2 font-mono text-xs text-foreground">
                {googleCurl}
              </pre>
              <CopyButton
                value={googleCurl}
                label="Copiar curl de Google"
                variant="outline"
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              DuckDuckGo
            </p>
            <div className="flex items-start gap-2">
              <pre className="flex-1 overflow-x-auto rounded bg-secondary p-2 font-mono text-xs text-foreground">
                {duckCurl}
              </pre>
              <CopyButton
                value={duckCurl}
                label="Copiar curl de DuckDuckGo"
                variant="outline"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-medium tracking-tight text-foreground">Google Sheets</h2>
        <p className="text-sm text-muted-foreground">
          Pegá esta fórmula en una celda para mostrar el favicon:
        </p>
        <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(40,35,30,0.03)]">
          <code className="flex-1 break-all font-mono text-sm text-foreground">
            {sheetsFormula}
          </code>
          <CopyButton value={sheetsFormula} label="Copiar fórmula IMAGE" />
        </div>
        <p className="text-sm text-muted-foreground">
          Más ejemplos en la{" "}
          <Link href="/guia/google-sheets" className="text-primary hover:underline">
            guía de Google Sheets
          </Link>
          .
        </p>
      </section>

      <p className="rounded-2xl border border-border/80 bg-accent/60 px-4 py-3 text-sm text-muted-foreground">
        Los favicons se obtienen de servicios públicos según el dominio de la entidad.
        No somos fuente oficial de marca; para uso corporativo consultá las guías de cada
        organización.
      </p>

      {related.length > 0 && (
        <section>
          <h2 className="font-serif mb-4 text-lg font-medium tracking-tight text-foreground">
            Otros logos de {entity.categoryName}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {related.map((relatedEntity) => (
              <EntityPreviewCard key={relatedEntity.id} entity={relatedEntity} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
