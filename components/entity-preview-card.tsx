import { AppLink as Link } from "@/components/app-link"
import { ArrowUpRight } from "lucide-react"
import { getEntityLogoUrl } from "@/lib/entity-logo"
import type { EntityRecord } from "@/lib/entity-index"
import {
  getLogoAssetInfo,
  logoThumbPath,
  logoToneClassName,
} from "@/lib/logo-assets"
import { cn } from "@/lib/utils"

interface EntityPreviewCardProps {
  entity: EntityRecord
}

export function EntityPreviewCard({ entity }: EntityPreviewCardProps) {
  // 64px thumbnail (isotipo when there is one); remote favicons at 2x the 20px slot.
  const thumb = logoThumbPath(entity.slug)
  const src = thumb ?? getEntityLogoUrl(entity, 64)
  const toneClassName = thumb
    ? logoToneClassName(getLogoAssetInfo(entity.slug).thumbTone)
    : ""

  return (
    <Link
      href={`/logo/${entity.slug}`}
      className="group -my-1.5 flex items-center gap-2 py-1.5"
    >
      <img
        loading="lazy"
        decoding="async"
        src={src}
        alt=""
        width={20}
        height={20}
        className={cn(
          "h-5 w-5 shrink-0 rounded object-contain",
          toneClassName && "p-px",
          toneClassName
        )}
        referrerPolicy="no-referrer"
      />
      <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground group-hover:text-primary">
        {entity.name}
      </h3>
      <ArrowUpRight
        className="h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  )
}
