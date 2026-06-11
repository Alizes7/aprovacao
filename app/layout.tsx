// app/layout.tsx
import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Portal de Aprovação | Bescheiben',
  description: 'Sistema de aprovação de posts para agências e clientes',
  icons: { icon: '/logo-bescheiben.png', apple: '/logo-bescheiben.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="bg-surface text-ink antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
