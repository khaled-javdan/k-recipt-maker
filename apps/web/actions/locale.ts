"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n"

// The language is a per-device preference, not account data: one person may run
// the app in Farsi on the counter machine and hand an English sheet to a
// customer from a phone. A cookie is what the server can read while rendering.

const ONE_YEAR = 60 * 60 * 24 * 365

export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return

  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR,
    sameSite: "lax",
    path: "/",
    // Readable by script: nothing here is sensitive, and it keeps the choice
    // available to the client without a second source of truth.
    httpOnly: false,
  })

  // Every page holds translated text, so the whole tree is stale.
  revalidatePath("/", "layout")
}
