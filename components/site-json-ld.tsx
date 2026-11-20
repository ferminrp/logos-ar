import { getSiteUrl } from '@/lib/site-url'
import {
  HOME_DESCRIPTION,
  SITE_ALTERNATE_NAME,
  SITE_NAME,
} from '@/lib/site-brand'

const siteUrl = getSiteUrl()

const siteSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAME,
      description: HOME_DESCRIPTION,
      publisher: { '@id': `${siteUrl}/#organization` },
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
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAME,
      url: siteUrl,
      logo: `${siteUrl}/apple-icon.png`,
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
