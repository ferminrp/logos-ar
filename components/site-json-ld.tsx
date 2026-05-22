import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()

const siteSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Logos Argentina',
      description:
        'Directorio de logos de bancos, fintechs y ALyCs de Argentina. Copiá los curls para usar en tu web.',
      inLanguage: 'es-AR',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Logos Argentina',
      url: siteUrl,
      sameAs: ['https://github.com/ferminrp/logos-ar'],
    },
  ],
}

export function SiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
    />
  )
}
