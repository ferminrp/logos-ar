"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { Github, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get("q") ?? ""
  const [searchValue, setSearchValue] = useState(currentQuery)

  useEffect(() => {
    setSearchValue(currentQuery)
  }, [currentQuery])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const query = searchValue.trim()
    const nextParams = new URLSearchParams()

    if (query) {
      nextParams.set("q", query)
    }

    const nextUrl = nextParams.size > 0 ? `/?${nextParams.toString()}` : "/"

    if (pathname === "/" && currentQuery === query) {
      return
    }

    router.push(nextUrl)
  }

  const brandClassName =
    "block truncate text-xl font-semibold leading-none text-white sm:text-[1.7rem]"

  return (
    <header className="bg-background px-2 pt-2 sm:px-4 sm:pt-3">
      <div className="mx-auto max-w-[96rem]">
        <div className="rounded-2xl bg-[#12633f] px-5 pb-7 pt-4 shadow-sm sm:px-8 sm:pb-8 sm:pt-6">
          <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[auto_minmax(20rem,1fr)_auto] lg:items-center lg:gap-8">
            <div className="flex items-center">
              <div className="min-w-0">
                <Link href="/" className={brandClassName}>
                  Logos Argentina
                </Link>
                <p className="mt-1 text-sm text-emerald-50/90">
                  Directorio de favicons
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-100/80" />
              <Input
                type="search"
                placeholder="Buscar por nombre o dominio..."
                className="h-12 rounded-full border border-white/15 bg-white/15 pl-10 pr-4 text-sm text-white placeholder:text-white/65 focus-visible:border-emerald-200/60 focus-visible:ring-2 focus-visible:ring-emerald-100/35 sm:h-14 sm:pl-11 sm:text-[15px]"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </form>

            <div className="flex flex-wrap items-center gap-2 lg:justify-self-end">
              <Button
                asChild
                size="sm"
                className={cn(
                  "h-9 rounded-lg border-0 bg-white/10 px-4 text-white shadow-none hover:bg-white/18",
                  "focus-visible:ring-white/30"
                )}
              >
                <Link href="/categorias">Categorías</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className={cn(
                  "h-9 rounded-lg border-0 bg-white/10 px-4 text-white shadow-none hover:bg-white/18",
                  "focus-visible:ring-white/30"
                )}
              >
                <Link href="/docs">Docs</Link>
              </Button>
              <Button
                asChild
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-lg border-0 bg-white/10 text-white shadow-none hover:bg-white/18",
                  "focus-visible:ring-white/30"
                )}
              >
                <a
                  href="https://github.com/ferminrp/logos-ar"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Repositorio de Logos AR en GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
