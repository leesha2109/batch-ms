import AuthSessionProvider from '@/components/SessionProvider'
import './globals.css'

export const metadata = {
  title: 'BatchMS — Batch Management System',
}

import type { ReactNode } from 'react'

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}