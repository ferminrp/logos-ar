import { FaqJsonLd } from "@/components/faq-json-ld"
import { SiteJsonLd } from "@/components/site-json-ld"
import { HomePage } from "@/components/home-page"
import { ConfigProvider } from "@/lib/config-context"
import { Suspense } from "react"

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Logos Argentina - Directorio de Favicons</h1>
      <SiteJsonLd />
      <FaqJsonLd />
      <ConfigProvider>
        <Suspense fallback={null}>
          <HomePage />
        </Suspense>
      </ConfigProvider>
    </>
  )
}
