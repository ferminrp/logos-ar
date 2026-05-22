import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SiteNavbar } from '@/components/site-navbar'
import { ThemeProvider } from '@/components/theme-provider'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Logos Argentina - Directorio de Favicons',
  description: 'Directorio de logos de bancos, fintechs y ALyCs de Argentina. Copiá los curls para usar en tu web.',
  keywords: [
    'logos argentina',
    'favicons bancos',
    'api logos',
    'fintech argentina',
    'logos fintech',
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
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
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
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
