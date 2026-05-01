"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { Github, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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

  return (
    <header className="bg-transparent">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="rounded-b-[2rem] bg-gradient-to-r from-[#0f3d2e] to-[#14532d] px-4 pb-10 pt-8 shadow-xl sm:px-6 sm:pb-12 lg:px-8">
          <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)_minmax(0,1fr)] lg:items-center">
            <div className="flex items-center gap-3 lg:justify-self-start">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white ring-1 ring-white/30">
                LA
              </div>
              <div className="space-y-1">
                <Link
                  href="/"
                  className="text-xl font-bold leading-none text-white sm:text-2xl"
                >
                  Logos Argentina
                </Link>
                <p className="text-sm text-emerald-100">
                  APIs gratuitas de logos
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative w-full lg:justify-self-center"
            >
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-900/60" />
              <Input
                type="search"
                placeholder="Buscar por nombre o dominio..."
                className="h-14 w-full rounded-full border-0 bg-white pl-14 pr-4 text-base text-foreground shadow-lg shadow-black/20 ring-1 ring-white/40 placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-emerald-300"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </form>

            <div className="flex flex-wrap items-center gap-2 lg:justify-self-end">
              <Button
                asChild
                size="sm"
                className="bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/docs">API</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/docs">Documentación</Link>
              </Button>
              <Button
                asChild
                size="icon"
                className="h-9 w-9 bg-white/10 text-white hover:bg-white/20"
              >
                <a
                  href="https://github.com/ferminrp/logos-ar"
                  target="_blank"
                  rel="noreferrer"
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
