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
      className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(40,35,30,0.03)] transition-all hover:border-border hover:shadow-[0_4px_16px_rgba(40,35,30,0.06)]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
        <img
          src={googleUrl}
          alt={`Logo de ${entity.name}`}
          width={32}
          height={32}
          className="h-8 w-8 rounded-lg object-contain"
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
