import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rachell Nails',
  description: 'Especialistas en uñas acrílicas, semipermanentes y pedicure',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-white`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
