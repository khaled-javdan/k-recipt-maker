import type { MetadataRoute } from "next"

import { getLocale, getT } from "@/lib/i18n/server"
import { localeDir } from "@/lib/i18n"

// Served at /manifest.webmanifest. Signed-out visitors must be able to fetch it
// too — an install prompt on the login screen is the normal way in — so
// proxy.ts lets this path through unauthenticated.
//
// Reading the locale cookie makes this route dynamic, which is the point: the
// installed app takes the name and writing direction of whichever language the
// user had chosen when they installed it.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [t, locale] = await Promise.all([getT(), getLocale()])

  return {
    name: t.appName,
    short_name: t.appName,
    description: t.pwa.description,
    lang: locale,
    dir: localeDir(locale),
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Drawn inside the 80% safe zone, so a launcher that crops to a circle
      // or squircle does not cut the logo.
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
