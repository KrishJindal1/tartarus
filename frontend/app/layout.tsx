import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { ToastProvider } from '@/components/ui'
import './globals.css'

export const metadata: Metadata = {
  title: 'JOCKEY | Forensic Operations Control Plane',
  description: 'Enterprise multi-system forensic telemetry, in-memory execution, and volatile memory inspection platform.',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0E11' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

