"use client"

import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqItems } from "@/lib/faq-data"

function FaqAnswer({ question, answer }: { question: string; answer: string }) {
  if (question === "¿Hay un api?") {
    return (
      <>
        Sí. Tenés disponible <code>GET /api/logos</code> para consultar entidades
        y filtrar por <code>q</code>, <code>domain</code> y <code>category</code>{" "}
        (opcional), con <code>limit</code> y <code>offset</code> para paginar. La{" "}
        <Link href="/docs" className="text-primary underline-offset-4 hover:underline">
          documentación de la API
        </Link>{" "}
        incluye ejemplos y detalles del endpoint.
      </>
    )
  }

  return <>{answer}</>
}

export function FaqSection() {
  return (
    <section
      className="border-t border-border bg-background"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2
          id="faq-heading"
          className="mb-6 text-lg font-semibold text-foreground"
        >
          Preguntas frecuentes
        </h2>
        <div className="rounded-lg border border-border bg-card px-4 sm:px-6">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-foreground hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  <FaqAnswer question={item.question} answer={item.answer} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
