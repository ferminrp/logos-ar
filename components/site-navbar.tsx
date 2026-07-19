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

  const navButtonClassName = cn(
    "h-9 rounded-xl border border-border/80 bg-transparent px-4 text-foreground shadow-none",
    "hover:bg-muted hover:text-foreground",
    "focus-visible:ring-ring/40"
  )

  return (
    <header className="bg-background px-2 pt-2 sm:px-4 sm:pt-3">
      <div className="mx-auto max-w-[96rem]">
        <div className="rounded-2xl border border-border/70 px-5 pb-6 pt-4 sm:px-8 sm:pb-7 sm:pt-5">
          <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[auto_minmax(20rem,1fr)_auto] lg:items-center lg:gap-8">
            <div className="flex items-center">
              <div className="min-w-0">
                <Link
                  href="/"
                  className="font-serif block truncate text-xl font-medium leading-none tracking-tight text-foreground sm:text-[1.7rem]"
                >
                  Logos Argentina
                </Link>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o dominio..."
                className="h-12 rounded-2xl border border-border bg-white pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-none focus-visible:border-ring/50 focus-visible:ring-2 focus-visible:ring-ring/25 sm:h-14 sm:pl-11 sm:text-[15px]"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </form>

            <div className="flex flex-wrap items-center gap-2 lg:justify-self-end">
              <Button asChild size="sm" variant="ghost" className={navButtonClassName}>
                <Link href="/categorias">Categorías</Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className={navButtonClassName}>
                <Link href="/docs">API</Link>
              </Button>
              <Button
                asChild
                size="icon"
                variant="ghost"
                className={cn(navButtonClassName, "w-9 px-0")}
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
