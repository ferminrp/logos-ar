import type { Category } from "./logos-data.ts"

export interface CategoryFeaturedLogoLink {
  slug: string
  heading: string
  description: string
}

export interface CategorySeoCopy {
  h1: string
  title: string
  metaDescription: string
  introLead?: string
  featuredLogoLink?: CategoryFeaturedLogoLink
}

const CATEGORY_SEO: Partial<Record<string, CategorySeoCopy>> = {
  bancos: {
    h1: "Logos de bancos argentinos",
    title: "Logos de bancos argentinos (PNG, SVG) | Loguitos",
    metaDescription:
      "Logos de bancos argentinos en PNG y SVG con fondo transparente. Galicia, Nación, BBVA, Santander, Macro, Provincia y más. Descarga gratis.",
    introLead:
      "Directorio de logos de bancos tradicionales, públicos y digitales de Argentina.",
    featuredLogoLink: {
      slug: "banco-de-la-nacion-argentina",
      heading: "Logo Banco Nación (BNA)",
      description:
        "PNG y SVG con fondo transparente y descarga gratis. El Banco Nación tiene su propia página.",
    },
  },
  prepagas: {
    h1: "Logos de prepagas y obras sociales en Argentina",
    title: "Logos de prepagas y obras sociales (PNG, SVG) | Loguitos",
    metaDescription:
      "Logos de medicina prepaga y obras sociales en Argentina: OSDE, Swiss Medical, Galeno, Medicus, Omint y más. PNG y SVG transparente, descarga gratis.",
    introLead:
      "Logos de empresas de medicina prepaga y obras sociales con cobertura en Argentina.",
  },
  automotrices: {
    h1: "Logos de marcas de autos en Argentina",
    title: "Logos de marcas de autos en Argentina (PNG, SVG) | Loguitos",
    metaDescription:
      "Logos de marcas de autos con presencia en Argentina: Toyota, VW, Ford, Chevrolet, Fiat, Audi y más. PNG y SVG transparente, descarga gratis.",
    introLead:
      "Marcas automotrices que comercializan autos y motos en el mercado argentino.",
  },
  retail: {
    h1: "Logos de supermercados argentinos",
    title: "Logos de supermercados argentinos (PNG, SVG) | Loguitos",
    metaDescription:
      "Logos de supermercados y cadenas de retail en Argentina: Coto, Jumbo, Disco, Carrefour, Día, Vea y más. PNG y SVG transparente, descarga gratis.",
    introLead:
      "Supermercados, hipermercados y cadenas de consumo masivo con operación en Argentina.",
  },
  gastronomia: {
    h1: "Logos de delivery y gastronomía en Argentina",
    title: "Logos de delivery y gastronomía (PNG, SVG) | Loguitos",
    metaDescription:
      "Logos de PedidosYa, Rappi, Uber Eats y cadenas gastronómicas en Argentina. PNG y SVG transparente, descarga gratis.",
    introLead:
      "Apps de delivery y marcas gastronómicas con presencia en Argentina.",
  },
}

const META_DESCRIPTION_MAX_LENGTH = 155

function buildCategoryMetaDescription(category: Category): string {
  const names = category.seoTopEntities.slice(0, 4).join(", ")
  const lead = `Logos de ${category.name} en Argentina`
  const candidates = [
    `${lead}: ${names} y más. ${category.entities.length} marcas en PNG y SVG, descarga gratis.`,
    `${lead}: ${names} y más. Descarga gratis en PNG y SVG.`,
    `${lead}: ${category.entities.length} marcas en PNG y SVG, descarga gratis.`,
  ]
  return (
    candidates.find((text) => text.length <= META_DESCRIPTION_MAX_LENGTH) ??
    candidates[candidates.length - 1]
  )
}

export function getCategorySeoCopy(category: Category): CategorySeoCopy {
  const override = CATEGORY_SEO[category.id]
  if (override) return override

  return {
    h1: `Logos de ${category.name} en Argentina`,
    title: `Logos de ${category.name} en Argentina (PNG, SVG) | Loguitos`,
    metaDescription: buildCategoryMetaDescription(category),
  }
}
