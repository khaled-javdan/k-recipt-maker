import { ar } from "./ar"
import { en } from "./en"
import { fa, type Dictionary } from "./fa"

export type { Dictionary }

export type Locale = "fa" | "ar" | "en"

export const DEFAULT_LOCALE: Locale = "fa"

/** The cookie the switcher writes and the server reads on every request. */
export const LOCALE_COOKIE = "rm_locale"

const DICTIONARIES: Record<Locale, Dictionary> = { fa, ar, en }

// Two of the three are right-to-left, so direction travels with the locale
// rather than being assumed. The label is written in its own language: someone
// who has landed in the wrong one still needs to recognise their way out.
export const LOCALES: { code: Locale; label: string; dir: "rtl" | "ltr" }[] = [
  { code: "fa", label: "فارسی", dir: "rtl" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
]

export function isLocale(value: unknown): value is Locale {
  return value === "fa" || value === "ar" || value === "en"
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

export function localeDir(locale: Locale): "rtl" | "ltr" {
  return locale === "en" ? "ltr" : "rtl"
}
