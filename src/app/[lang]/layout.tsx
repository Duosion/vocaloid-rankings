import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/navbar'
import { Noto_Sans_JP, Inter } from 'next/font/google'
import localFont from "next/font/local"
import { Providers } from '@/components/providers/providers'
import { Locale, getDictionary } from '@/localization/'
import Footer from '@/components/footer'
import { GoogleAnalytics } from '@/components/scripts/gtag'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-jp'
})
const materialSymbols = localFont({
  variable: '--font-family-symbols', // Variable name (to reference after in CSS/styles)
  style: 'normal',
  src: '../../../node_modules/material-symbols/material-symbols-rounded.woff2', // This is a reference to woff2 file from NPM package "material-symbols"
  display: 'block',
  weight: '100 700',
})

export const metadata: Metadata = {
  title: 'Vocaloid Rankings',
  description: 'A site that ranks vocaloid songs based on their view counts.',
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: {
    lang: Locale
  }
}) {
  const locale = params.lang
  const langDict = await getDictionary(locale)
  return (
    <html lang={locale} className={`${inter.variable} ${notoSansJP.variable} ${materialSymbols.variable}`}>
      <body className='bg-background'>
        <Providers dictionary={langDict}>
          {process.env.NODE_ENV == 'production' ? <GoogleAnalytics tag={process.env.GOOGLE_ANALYTICS_TAG || ''} /> : undefined}
          <Navbar lang={locale} />
          <main className='max-w-[1920px] min-h-screen m-auto flex flex-col justify-start items-center px-5 py-6'>
            {children}
          </main>
          <Footer lang={locale} />
        </Providers>
      </body>
    </html>
  )
}
