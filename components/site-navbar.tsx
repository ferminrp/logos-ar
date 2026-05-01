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

  return (
    <header className="bg-background px-2 pt-2 sm:px-4 sm:pt-3">
      <div className="mx-auto max-w-[96rem]">
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#12633f_0%,#0f5a39_42%,#0d4e33_100%)] px-5 pb-9 pt-4 shadow-[0_18px_48px_rgba(8,56,35,0.14)] sm:px-8 sm:pb-10 sm:pt-6">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[inherit]"
          >
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0,rgba(255,255,255,0.06)_45%,transparent_72%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.03)_18%,transparent_18%,transparent_100%)]" />
            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(140deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-position:-24px_0] [background-size:140px_140px]" />
          </div>

          <div className="relative mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[auto_minmax(20rem,1fr)_auto] lg:items-center lg:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2ba35f] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-white/16">
                LA
              </div>
              <div className="min-w-0">
                <Link
                  href="/"
                  className="block truncate text-xl font-semibold leading-none text-white sm:text-[1.7rem]"
                >
                  Logos Argentina
                </Link>
                <p className="mt-1 text-sm text-emerald-50/86">
                  APIs gratuitas de logos
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2b6c50]" />
              <Input
                type="search"
                placeholder="Buscar por nombre o dominio..."
                className="h-12 rounded-full border border-white/10 bg-[rgba(255,255,255,0.16)] pl-10 pr-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] placeholder:text-white/62 focus-visible:border-emerald-200/60 focus-visible:ring-2 focus-visible:ring-emerald-100/35 sm:h-14 sm:pl-11 sm:text-[15px] lg:bg-[rgba(255,255,255,0.14)]"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </form>

            <div className="hidden flex-wrap items-center gap-2 sm:flex lg:justify-self-end">
              <Button
                asChild
                size="sm"
                className={cn(
                  "h-9 rounded-lg border-0 bg-white/9 px-4 text-white shadow-none hover:bg-white/16",
                  "focus-visible:ring-white/30"
                )}
              >
                <Link href="/docs">API</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className={cn(
                  "h-9 rounded-lg border-0 bg-white/9 px-4 text-white shadow-none hover:bg-white/16",
                  "focus-visible:ring-white/30"
                )}
              >
                <Link href="/docs">Documentación</Link>
              </Button>
              <Button
                asChild
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-lg border-0 bg-white/9 text-white shadow-none hover:bg-white/16",
                  "focus-visible:ring-white/30"
                )}
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
