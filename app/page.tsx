import { FaqJsonLd } from "@/components/faq-json-ld"
import { SiteJsonLd } from "@/components/site-json-ld"
import { HomePage } from "@/components/home-page"
import { Suspense } from "react"

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Logos Argentina - Directorio de Favicons</h1>
      <SiteJsonLd />
      <FaqJsonLd />
      <Suspense fallback={null}>
        <HomePage />
      </Suspense>
    </>
  )
}
