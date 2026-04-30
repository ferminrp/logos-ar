import { FaqJsonLd } from "@/components/faq-json-ld"
import { HomePage } from "@/components/home-page"
import { ConfigProvider } from "@/lib/config-context"

export default function Page() {
  return (
    <>
      <FaqJsonLd />
      <ConfigProvider>
        <HomePage />
      </ConfigProvider>
    </>
  )
}
