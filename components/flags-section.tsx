import Link from "next/link"
import { FlagCard } from "@/components/flag-card"
import type { Flag } from "@/lib/flags-data"

interface FlagsSectionProps {
  flags: Flag[]
  showTitleLink?: boolean
}

export function FlagsSection({ flags, showTitleLink = true }: FlagsSectionProps) {
  return (
    <section id="banderas" className="scroll-mt-20">
      <h2 className="font-serif mb-4 text-xl font-medium tracking-tight text-foreground">
        {showTitleLink ? (
          <Link href="/categoria/banderas" className="hover:text-primary">
            Banderas
          </Link>
        ) : (
          "Banderas"
        )}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {flags.map((flag) => (
          <FlagCard key={flag.code} flag={flag} />
        ))}
      </div>
    </section>
  )
}
