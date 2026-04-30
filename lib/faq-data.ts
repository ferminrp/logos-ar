export interface FaqItem {
  question: string
  answer: string
}

export const faqItems: FaqItem[] = [
  {
    question: "¿Cómo puedo usar estos logos en spreadsheets?",
    answer:
      "Copiá la URL del favicon que mostramos (Google o DuckDuckGo) y usala como imagen por URL. En Google Sheets podés usar la función IMAGE(url) en una celda. En Excel, Insertar > Imágenes > Insertar imagen desde vínculo depende de la versión; si no carga, probá descargar la imagen o usar otro proveedor. La disponibilidad y el formato (.ico vs PNG) dependen del servicio y del dominio.",
  },
  {
    question: "¿Necesito una API key o registrarme?",
    answer:
      "No. Las URLs que mostramos apuntan a servicios públicos de favicons de Google y DuckDuckGo. No hace falta cuenta ni clave para armar el enlace; solo reemplazá el dominio por el de la entidad.",
  },
  {
    question: "¿Hay un api?",
    answer:
      "Sí. Tenés disponible `GET /api/logos` para consultar entidades y filtrar por `q`, `domain` y `category` (opcional), con `limit` y `offset` para paginar. La documentación y ejemplos están en `/docs`.",
  },
  {
    question: "¿Cuál es la diferencia entre Google y DuckDuckGo?",
    answer:
      "Ambos resuelven un favicon a partir del dominio. Google suele devolver PNG según el parámetro de tamaño (sz). DuckDuckGo entrega .ico en una ruta fija. Podés probar ambos y quedarte con el que mejor se vea en tu app u hoja de cálculo.",
  },
  {
    question: "¿Los logos son oficiales?",
    answer:
      "Mostramos favicons tal como los exponen esos servicios a partir del dominio público de cada entidad. No somos fuente oficial de marca; para uso corporativo o compliance conviene pedir los activos al área legal o marketing de cada empresa.",
  },
  {
    question: "¿Puedo usar estos logos en mi producto o sitio web?",
    answer:
      "Los derechos de marca y uso de cada logo los tiene su titular. Esta herramienta solo facilita URLs técnicas de favicon. Es tu responsabilidad respetar términos de uso, guías de marca y normativa aplicable.",
  },
  {
    question: "¿Qué dominio debo poner en la plantilla de la URL?",
    answer:
      "Usá el dominio que figura en cada tarjeta (por ejemplo el sitio web principal de la entidad). Es el mismo valor que reemplaza {DOMINIO} en las plantillas de Google y DuckDuckGo que copiás desde la página.",
  },
]
