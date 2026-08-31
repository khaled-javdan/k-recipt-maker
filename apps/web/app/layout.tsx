import type { Metadata, Viewport } from "next"
import { Vazirmatn } from "next/font/google"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { Toaster } from "@workspace/ui/components/sonner"

import { ThemeProvider } from "@/components/theme-provider"
import { fa } from "@/lib/fa"

// Vazirmatn carries the Persian glyphs and the Latin digits the sheets print
// their numbers in, so one family covers the whole app.
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: fa.appName,
  description: "مدیریت فاکتور، حساب، فیش مزاد و فیش من",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={cn("font-sans antialiased", vazirmatn.variable)}
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
