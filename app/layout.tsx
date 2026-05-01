import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SiteNavbar } from '@/components/site-navbar'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL.startsWith('http')
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null) ??
  'https://logos-ar.vercel.app'

export const metadata: Metadata = {
  title: 'Logos Argentina - Directorio de Favicons',
  description: 'Directorio de logos de bancos, fintechs y ALyCs de Argentina. Copiá los curls para usar en tu web.',
  generator: 'v0.app',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Logos Argentina - Directorio de Favicons',
    description: 'Directorio de logos de bancos, fintechs y ALyCs de Argentina. Copiá los curls para usar en tu web.',
    type: 'website',
    locale: 'es_AR',
    images: [
      {
        url: '/og-image.jpg',
        width: 1024,
        height: 682,
        alt: 'Logos Argentina',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Logos Argentina - Directorio de Favicons',
    description: 'Directorio de logos de bancos, fintechs y ALyCs de Argentina. Copiá los curls para usar en tu web.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇦🇷</text></svg>',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gaMeasurementId = 'G-GZLZ092Z7S'

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <SiteNavbar />
          </Suspense>
          {children}
        </ThemeProvider>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaMeasurementId}');
          `}
        </Script>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
