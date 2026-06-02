import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mes Droits Ma Voix',
  description: 'Plateforme de participation des travailleurs ESAT',
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
      <body>{children}</body>
    </html>
  )
}