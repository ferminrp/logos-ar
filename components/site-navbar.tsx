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
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-1">
          <Link href="/" className="text-xl font-bold text-foreground sm:text-2xl">
            Logos Argentina
          </Link>
          <p className="text-sm text-muted-foreground">
            {"¿Sabías que hay APIs gratuitas de logos?"}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <form onSubmit={handleSubmit} className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o dominio..."
              className="pl-9"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </form>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/docs">API</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
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
    </header>
  )
}
