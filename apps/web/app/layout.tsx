import type { Metadata, Viewport } from "next"
import { Vazirmatn } from "next/font/google"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { Toaster } from "@workspace/ui/components/sonner"

import { I18nProvider } from "@/components/i18n-provider"
import { PwaRegister } from "@/components/pwa-register"
import { ThemeProvider } from "@/components/theme-provider"
import { localeDir } from "@/lib/i18n"
import { getLocale, getT } from "@/lib/i18n/server"

// Vazirmatn carries the Persian and Arabic glyphs and the Latin digits the
// sheets print their numbers in, so one family covers all three languages.
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: t.appName,
    description: t.meta.description,
    applicationName: t.appName,
    // Next links /manifest.webmanifest itself once app/manifest.ts exists;
    // these are the parts iOS reads instead of the manifest.
    appleWebApp: { capable: true, statusBarStyle: "default", title: t.appName },
    icons: { apple: "/icons/apple-touch-icon.png" },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolved once per request from the cookie, and everything below — direction,
  // the toaster's own position, every string — follows from it.
  const locale = await getLocale()
  const dir = localeDir(locale)

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn("font-sans antialiased", vazirmatn.variable)}
    >
      <body>
        <I18nProvider locale={locale}>
          <ThemeProvider>
            {children}
            <Toaster position="top-center" richColors dir={dir} />
            <PwaRegister />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
