import Link from "next/link"
import { getGoogleFaviconUrl } from "@/lib/favicon-urls"
import type { EntityRecord } from "@/lib/entity-index"

interface EntityPreviewCardProps {
  entity: EntityRecord
}

export function EntityPreviewCard({ entity }: EntityPreviewCardProps) {
  const googleUrl = getGoogleFaviconUrl(entity.domain)

  return (
    <Link
      href={`/logo/${entity.slug}`}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
        <img
          src={googleUrl}
          alt={`Logo de ${entity.name}`}
          width={32}
          height={32}
          className="h-8 w-8 rounded-md object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-foreground group-hover:text-primary">
          {entity.name}
        </h3>
        <p className="truncate text-sm text-muted-foreground">{entity.domain}</p>
      </div>
    </Link>
  )
}
