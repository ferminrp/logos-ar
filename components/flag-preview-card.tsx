import Link from "next/link"
import type { Flag } from "@/lib/flags-data"
import { getFlagSvgUrl } from "@/lib/flag-urls"

interface FlagPreviewCardProps {
  flag: Flag
}

export function FlagPreviewCard({ flag }: FlagPreviewCardProps) {
  const svgUrl = getFlagSvgUrl(flag.code)

  return (
    <Link
      href={`/categoria/banderas#${flag.code}`}
      className="group flex items-center gap-2"
    >
      <img
        src={svgUrl}
        alt={`Bandera de ${flag.name}`}
        width={24}
        height={16}
        className="h-4 w-6 shrink-0 rounded object-cover"
      />
      <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground group-hover:text-primary">
        {flag.name}
      </h3>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {flag.code}
      </span>
    </Link>
  )
}
