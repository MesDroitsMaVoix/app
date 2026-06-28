import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegister from '../components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'Mes Droits Ma Voix',
  description: 'Plateforme de participation des travailleurs ESAT',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mes Droits',
  },
}

export const viewport: Viewport = {
  themeColor: '#FF6B5E',
  width: 'device-width',
  initialScale: 1,
  // No maximumScale: blocking pinch-zoom harms accessibility (WCAG 1.4.4).
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}