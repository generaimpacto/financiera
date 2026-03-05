import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Financiera | Genera Impacto',
  description: 'Plataforma privada de gestión de pagos y finanzas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
