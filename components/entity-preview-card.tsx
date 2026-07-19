import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
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
      className="group flex items-center gap-2"
    >
      <img
        src={googleUrl}
        alt={`Logo de ${entity.name}`}
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 rounded object-contain"
        referrerPolicy="no-referrer"
      />
      <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground group-hover:text-primary">
        {entity.name}
      </h3>
      <ArrowUpRight
        className="h-4 w-4 shrink-0 text-muted-foreground sm:hidden"
        aria-hidden
      />
    </Link>
  )
}
