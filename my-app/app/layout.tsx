import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/AuthContext"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Vapi Negotiation System - AI Customer Service",
  description: "Let our AI agent handle your refunds, returns, and bill negotiations automatically",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
