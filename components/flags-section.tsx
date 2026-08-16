import Link from "next/link"
import { FlagPreviewCard } from "@/components/flag-preview-card"
import type { Flag } from "@/lib/flags-data"

interface FlagsSectionProps {
  flags: Flag[]
}

export function FlagsSection({ flags }: FlagsSectionProps) {
  return (
    <section id="banderas" className="scroll-mt-20">
      <h2 className="font-serif mb-4 text-xl font-medium tracking-tight text-foreground">
        <Link href="/categoria/banderas" className="hover:text-primary">
          Banderas
        </Link>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {flags.map((flag) => (
          <FlagPreviewCard key={flag.code} flag={flag} />
        ))}
      </div>
    </section>
  )
}
