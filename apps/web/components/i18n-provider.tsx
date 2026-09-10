"use client"

import { createContext, use } from "react"

import {
  DEFAULT_LOCALE,
  getDictionary,
  type Dictionary,
  type Locale,
} from "@/lib/i18n"

// Client components cannot read the cookie during render, so the server resolves
// the language once in the root layout and hands the dictionary down. `useT()`
// is the client-side counterpart of `getT()`, and returns the same object, so a
// component reads `t.nav.receipts` either way.

type Value = { locale: Locale; t: Dictionary }

const I18nContext = createContext<Value | null>(null)

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  // The dictionary is derived rather than serialised across the boundary: it is
  // static data already in the client bundle, so sending 243 strings with every
  // navigation would be pure weight.
  return (
    <I18nContext value={{ locale, t: getDictionary(locale) }}>
      {children}
    </I18nContext>
  )
}

export function useT(): Dictionary {
  return use(I18nContext)?.t ?? getDictionary(DEFAULT_LOCALE)
}

export function useLocale(): Locale {
  return use(I18nContext)?.locale ?? DEFAULT_LOCALE
}
