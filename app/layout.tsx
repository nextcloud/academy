import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Exposed as a variable rather than a class, because --font-mono in globals.css
// points at it and the mono utilities are used all over the catalog.
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Nextcloud Developer Course (Beta)',
  description: 'Learn to build Nextcloud apps — PHP and ExApp tracks. Beta: only the beginner tracks are written so far.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${jetBrainsMono.variable} bg-off-white text-ink antialiased`}>
        {children}
      </body>
    </html>
  )
}
