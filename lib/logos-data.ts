export interface Entity {
  id: number
  name: string
  domain: string
}

export interface Category {
  id: string
  name: string
  description: string
  entities: Entity[]
}

export const categories: Category[] = [
  {
    id: "bancos",
    name: "Bancos",
    description: "Bancos tradicionales y públicos de Argentina",
    entities: [
      { id: 1, name: "Banco de la Nación Argentina", domain: "bna.com.ar" },
      { id: 2, name: "Banco Santander Río", domain: "santander.com.ar" },
      { id: 3, name: "BBVA Argentina", domain: "bbva.com.ar" },
      { id: 4, name: "Banco Galicia", domain: "www.galicia.ar" },
      { id: 5, name: "Banco Macro", domain: "macro.com.ar" },
      { id: 6, name: "Banco Provincia (Bs. As.)", domain: "bancoprovincia.com.ar" },
      { id: 7, name: "Banco Ciudad", domain: "bancociudad.com.ar" },
      { id: 8, name: "Banco Patagonia", domain: "bancopatagonia.com.ar" },
      { id: 9, name: "Banco Hipotecario", domain: "hipotecario.com.ar" },
      { id: 10, name: "Banco Supervielle", domain: "supervielle.com.ar" },
      { id: 12, name: "Banco Credicoop", domain: "bancocredicoop.coop" },
      { id: 13, name: "Banco Comafi", domain: "comafi.com.ar" },
      { id: 14, name: "Banco Columbia", domain: "bancocolumbia.com.ar" },
      { id: 16, name: "Banco Piano", domain: "bancopiano.com.ar" },
      { id: 17, name: "Banco de Corrientes (BANCOR)", domain: "bancor.com.ar" },
    ],
  },
  {
    id: "fintechs",
    name: "Fintechs",
    description: "Billeteras digitales, neobancos y apps financieras",
    entities: [
      { id: 21, name: "Ualá", domain: "uala.com.ar" },
      { id: 22, name: "Mercado Pago", domain: "mercadopago.com.ar" },
      { id: 23, name: "Naranja X", domain: "naranjax.com" },
      { id: 24, name: "Brubank", domain: "brubank.com" },
      { id: 25, name: "Belo", domain: "belo.app" },
      { id: 26, name: "Lemon Cash", domain: "lemon.me" },
      { id: 27, name: "Personal Pay", domain: "personalpay.com.ar" },
      { id: 28, name: "Prex", domain: "prex.com.ar" },
      { id: 29, name: "ARQ", domain: "www.arqfinance.com" },
      { id: 30, name: "Fiwind", domain: "fiwind.io" },
      { id: 31, name: "Ripio", domain: "ripio.com" },
      { id: 32, name: "Buenbit", domain: "buenbit.com" },
      { id: 33, name: "Uilo Bank (ex Wilobank)", domain: "uilo.com.ar" },
      { id: 34, name: "IUDÚ", domain: "iudu.com.ar" },
      { id: 35, name: "Openbank", domain: "openbank.com.ar" },
      { id: 36, name: "Carrefour Banco", domain: "carrefourbanco.com.ar" },
      { id: 37, name: "Cocos", domain: "cocos.com.ar" },
      { id: 38, name: "Claro Pay", domain: "claropay.com.ar" },
      { id: 39, name: "Astropay", domain: "astropay.com" },
      { id: 40, name: "Nubi", domain: "nubi.com" },
    ],
  },
  {
    id: "alycs",
    name: "ALyCs",
    description: "Agentes de Liquidación y Compensación (brokers)",
    entities: [
      { id: 41, name: "Invertir Online (IOL)", domain: "invertironline.com" },
      { id: 42, name: "Balanz", domain: "balanz.com" },
      { id: 43, name: "Allaria", domain: "allaria.com.ar" },
      { id: 44, name: "Bull Market Brokers", domain: "bullmarketbrokers.com" },
      { id: 45, name: "AdCap Securities", domain: "www.ad-cap.com.ar" },
      { id: 46, name: "IEB (Invertir en Bolsa)", domain: "invertirenbolsa.com.ar" },
      { id: 47, name: "Cohen Aliados", domain: "cohen.com.ar" },
      { id: 49, name: "SBS Trading", domain: "www.gruposbs.com" },
    ],
  },
]

export function getGoogleFaviconUrl(domain: string, size: number = 128): string {
  return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=${size}`
}

export function getDuckDuckGoFaviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

export function getGoogleCurl(domain: string, size: number = 128): string {
  return `curl "${getGoogleFaviconUrl(domain, size)}" -o ${domain.replace(/\./g, "_")}_favicon.png`
}

export function getDuckDuckGoCurl(domain: string): string {
  return `curl "${getDuckDuckGoFaviconUrl(domain)}" -o ${domain.replace(/\./g, "_")}_favicon.ico`
}
