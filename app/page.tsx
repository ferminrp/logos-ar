import { FaqJsonLd } from "@/components/faq-json-ld"
import { HomePage } from "@/components/home-page"
import { ConfigProvider } from "@/lib/config-context"
import { Suspense } from "react"

export default function Page() {
  return (
    <>
      <FaqJsonLd />
      <ConfigProvider>
        <Suspense fallback={null}>
          <HomePage />
        </Suspense>
      </ConfigProvider>
    </>
  )
}
