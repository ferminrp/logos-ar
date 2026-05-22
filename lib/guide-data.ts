export interface GuideSection {
  heading: string
  paragraphs: string[]
  code?: string
}

export interface Guide {
  slug: string
  title: string
  description: string
  sections: GuideSection[]
}

export const guides: Guide[] = [
  {
    slug: "google-sheets",
    title: "Cómo usar favicons en Google Sheets",
    description:
      "Mostrá logos de bancos, fintechs y empresas argentinas en Google Sheets con la función IMAGE y URLs de favicon públicas.",
    sections: [
      {
        heading: "Paso 1: Obtener la URL del favicon",
        paragraphs: [
          "En Logos Argentina, buscá la entidad (por ejemplo Banco Galicia o Mercado Pago) y copiá la URL de Google o DuckDuckGo desde la ficha de la entidad o desde el directorio.",
        ],
      },
      {
        heading: "Paso 2: Usar IMAGE en una celda",
        paragraphs: [
          "En Google Sheets, pegá la fórmula en la celda donde querés ver el logo. Reemplazá la URL por la que copiaste.",
        ],
        code: '=IMAGE("https://s2.googleusercontent.com/s2/favicons?domain=www.galicia.ar&sz=128")',
      },
      {
        heading: "Consejos",
        paragraphs: [
          "El parámetro sz en Google controla el tamaño (por ejemplo 64, 128). Si una imagen no carga, probá el proveedor DuckDuckGo o verificá que el dominio sea el sitio principal de la entidad.",
          "Los favicons no son archivos oficiales de marca; para materiales corporativos pedí los assets al área de marketing de cada empresa.",
        ],
      },
    ],
  },
  {
    slug: "excel",
    title: "Logo por URL en Excel",
    description:
      "Insertá favicons de entidades argentinas en Excel usando vínculos a URLs públicas de Google o DuckDuckGo.",
    sections: [
      {
        heading: "Insertar imagen desde vínculo",
        paragraphs: [
          "Copiá la URL del favicon desde Logos Argentina (pestaña de la entidad o tarjeta en el directorio). En Excel: Insertar > Imágenes > Insertar imagen desde vínculo (según tu versión de Office).",
          "Pegá la URL completa del servicio Google o DuckDuckGo.",
        ],
      },
      {
        heading: "Si no carga",
        paragraphs: [
          "Algunas versiones de Excel bloquean dominios externos o formatos .ico. Descargá el archivo con el comando curl que mostramos en cada ficha, o probá la URL de Google en PNG.",
        ],
        code: 'curl "https://s2.googleusercontent.com/s2/favicons?domain=mercadopago.com.ar&sz=128" -o mercadopago_favicon.png',
      },
    ],
  },
  {
    slug: "desarrolladores",
    title: "API y URLs de logos para desarrolladores",
    description:
      "Integrá el directorio de logos argentinos en tu app con GET /api/logos o URLs directas de favicon sin API key.",
    sections: [
      {
        heading: "Endpoint REST",
        paragraphs: [
          "Consultá entidades con filtros por nombre, dominio y categoría. La documentación completa está en /docs.",
        ],
        code: `GET /api/logos?category=fintechs&q=uala
GET /api/logos?domain=galicia.ar&limit=10`,
      },
      {
        heading: "URL directa en frontend",
        paragraphs: [
          "Para mostrar un favicon en React, HTML o mobile, usá la URL de Google con el dominio de la entidad:",
        ],
        code: "https://s2.googleusercontent.com/s2/favicons?domain={DOMINIO}&sz=128",
      },
      {
        heading: "Catálogo estático",
        paragraphs: [
          "También podés enlazar fichas por entidad (/logo/...) o listar por categoría (/categoria/bancos) para SEO y descubrimiento sin llamar a la API.",
        ],
      },
    ],
  },
  {
    slug: "google-vs-duckduckgo",
    title: "Google vs DuckDuckGo para favicons",
    description:
      "Compará los servicios públicos de favicon que usa Logos Argentina: formato, tamaño y cuándo conviene cada uno.",
    sections: [
      {
        heading: "Google Favicon Service",
        paragraphs: [
          "Devuelve PNG y permite definir tamaño con el parámetro sz (por ejemplo 128). Suele verse bien en interfaces web y spreadsheets.",
        ],
        code: "https://s2.googleusercontent.com/s2/favicons?domain=bbva.com.ar&sz=128",
      },
      {
        heading: "DuckDuckGo Icons",
        paragraphs: [
          "Ruta fija que entrega .ico por dominio. Útil cuando necesitás el formato clásico o Google no resuelve bien un sitio.",
        ],
        code: "https://icons.duckduckgo.com/ip3/bbva.com.ar.ico",
      },
      {
        heading: "Recomendación práctica",
        paragraphs: [
          "Probá ambos en tu UI o hoja de cálculo y quedate con el que mejor renderice para cada dominio. En Logos Argentina mostramos ambas URLs y curls en cada ficha de entidad.",
        ],
      },
    ],
  },
]

export function getGuideBySlug(slug: string): Guide | null {
  return guides.find((guide) => guide.slug === slug) ?? null
}

export function getAllGuideSlugs(): string[] {
  return guides.map((guide) => guide.slug)
}
