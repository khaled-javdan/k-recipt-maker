import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"

import {
  DEFAULT_LOCALE,
  getDictionary,
  isLocale,
  LOCALE_COOKIE,
  type Dictionary,
  type Locale,
} from "./index"

// Server components and server actions read the language from the cookie the
// switcher wrote. Cached per request, so a page and every component in it share
// one cookie read rather than each doing their own.

export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
})

/** The dictionary for this request. Server-side counterpart of `useT()`. */
export const getT = cache(async (): Promise<Dictionary> => {
  return getDictionary(await getLocale())
})
