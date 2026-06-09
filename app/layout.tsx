import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { GeistPixelGrid } from 'geist/font/pixel'
import { ThemeProvider } from '@/components/theme-provider'
import { Sidebar } from '@/components/sidebar'

import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'TestGenAI — Automated Test Case Generator Agent',
  description:
    'TestGenAI is an AI-powered agent that uploads source code, detects functions, generates unit and edge-case tests, executes them, and reports coverage and evaluation metrics.',
  keywords: [
    'automated test generation',
    'AI test cases',
    'unit testing',
    'code coverage',
    'test execution',
    'pytest',
    'edge case testing',
    'developer tools',
  ],
  authors: [{ name: 'TestGenAI' }],
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#F2F1EA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${GeistPixelGrid.variable}`} suppressHydrationWarning>
      <body className="font-mono antialiased bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <div className="min-h-screen dot-grid-bg">
            <Sidebar />
            <div className="lg:pl-64">
              <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
