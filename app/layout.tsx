import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SiteNavbar } from '@/components/site-navbar'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Logos Argentina - Directorio de Favicons',
  description: 'Directorio de logos de bancos, fintechs y ALyCs de Argentina. Copiá los curls para usar en tu web.',
  generator: 'v0.app',
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
    <html lang="es" className="bg-background">
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <SiteNavbar />
        </Suspense>
        {children}
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
