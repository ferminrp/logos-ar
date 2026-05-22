import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API de logos — Logos Argentina',
  description:
    'Documentación del endpoint GET /api/logos: filtros por nombre, dominio y categoría, paginación y ejemplos.',
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    title: 'API de logos — Logos Argentina',
    description:
      'Documentación del endpoint GET /api/logos: filtros por nombre, dominio y categoría, paginación y ejemplos.',
    url: '/docs',
    type: 'website',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API de logos — Logos Argentina',
    description:
      'Documentación del endpoint GET /api/logos: filtros por nombre, dominio y categoría, paginación y ejemplos.',
  },
}

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
