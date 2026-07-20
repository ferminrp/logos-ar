import Link from "next/link"
import { categories } from "@/lib/logos-data"
import { cn } from "@/lib/utils"

function categoryLinkClassName() {
  return cn(
    "text-sm text-muted-foreground transition-colors hover:text-foreground"
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav
          aria-label="Categorías"
          className="mb-6 hidden lg:block"
        >
          <h2 className="font-serif mb-4 text-sm font-medium tracking-tight text-foreground">
            Categorías
          </h2>
          <div className="grid grid-cols-3 gap-x-8 gap-y-2 xl:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.id}`}
                className={categoryLinkClassName()}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </nav>

        <p className="text-sm text-muted-foreground">
          Datos recopilados de entidades argentinas. Los logos son propiedad de
          sus respectivas empresas.{" "}
          <Link href="/docs" className="text-primary hover:underline">
            Cómo usar los endpoints
          </Link>
        </p>
      </div>
    </footer>
  )
}
