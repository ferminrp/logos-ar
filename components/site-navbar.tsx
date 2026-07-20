"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { ChevronDown, Github, Menu, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { categories } from "@/lib/logos-data"
import { cn } from "@/lib/utils"

export function SiteNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQuery = (searchParams.get("q") ?? "").trim()
  const [searchValue, setSearchValue] = useState(currentQuery)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setSearchValue(currentQuery)
  }, [currentQuery])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)")

    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMenuOpen(false)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const query = searchValue.trim()
    const nextParams = new URLSearchParams()

    if (query) {
      nextParams.set("q", query)
    }

    const nextUrl = nextParams.size > 0 ? `/?${nextParams.toString()}` : "/"

    if (pathname === "/" && currentQuery === query) {
      setMenuOpen(false)
      return
    }

    setMenuOpen(false)
    router.push(nextUrl)
  }

  const navButtonClassName = cn(
    "h-9 rounded-xl border border-border/80 bg-transparent px-4 text-foreground shadow-none",
    "hover:bg-muted hover:text-foreground",
    "focus-visible:ring-ring/40"
  )

  const mobileNavButtonClassName = cn(navButtonClassName, "px-3 text-sm")

  const searchForm = (className?: string, inputClassName?: string) => (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar por nombre o dominio..."
        className={cn(
          "h-12 rounded-2xl border border-border bg-white pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground shadow-none focus-visible:border-ring/50 focus-visible:ring-2 focus-visible:ring-ring/25 md:text-sm",
          inputClassName
        )}
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
      />
    </form>
  )

  return (
    <header className="bg-background">
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-4 sm:px-6 lg:px-8 lg:pb-7 lg:pt-5">
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="font-serif shrink-0 text-xl font-medium leading-none tracking-tight text-foreground"
          >
            L.A.
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <Button asChild size="sm" variant="ghost" className={mobileNavButtonClassName}>
              <Link href="/categorias" onClick={() => setMenuOpen(false)}>
                Categorías
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className={mobileNavButtonClassName}>
              <Link href="/docs" onClick={() => setMenuOpen(false)}>
                API
              </Link>
            </Button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={cn(navButtonClassName, "w-9 shrink-0 px-0")}
                  aria-label="Abrir menú"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full gap-0 sm:max-w-sm">
                <SheetHeader className="border-b border-border pb-4">
                  <SheetTitle>Menú</SheetTitle>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
                  {searchForm()}

                  <Collapsible defaultOpen className="space-y-2">
                    <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-xl border border-border/80 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
                      Categorías
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 pl-1">
                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/categoria/${category.id}`}
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                  >
                    <a
                      href="https://github.com/ferminrp/logos-ar"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4" />
                      Repositorio en GitHub
                    </a>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden w-full gap-4 lg:grid lg:grid-cols-[auto_minmax(20rem,1fr)_auto] lg:items-center lg:gap-8">
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

          {searchForm(undefined, "sm:h-14 sm:pl-11")}

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
    </header>
  )
}
