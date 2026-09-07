import { toLatinDigits } from "./digits"

// Item prices are always quoted in multiples of five — 31 and 57 aren't real
// market prices. Applied when a field loses focus, never mid-typing, so
// entering "57" isn't fought keystroke by keystroke.
export function snapToFive(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value / 5) * 5
}

// String-in/string-out wrapper for price inputs. Blank stays blank, and
// anything unparseable is left alone rather than silently zeroed.
export function snapPriceInput(raw: string): string {
  const trimmed = toLatinDigits(raw).trim()
  if (!trimmed) return ""
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return raw
  return String(snapToFive(n))
}

// Money on these sheets settles in whole units — nobody hands over a fraction
// of a dirham, so a price is never shown or stored with decimals. This is a
// deliberate divergence from the original app, which printed up to two.
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value)
}

// String-in/string-out, for a money field losing focus. Blank stays blank and
// anything unparseable is left alone rather than silently zeroed, matching
// snapPriceInput.
export function roundMoneyInput(raw: string): string {
  const trimmed = toLatinDigits(raw).trim()
  if (!trimmed) return ""
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return raw
  return String(roundMoney(n))
}

const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

export const CURRENCY = "AED"

export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "0"
  return amountFormatter.format(value)
}

export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return `${CURRENCY} 0`
  return `${CURRENCY} ${amountFormatter.format(value)}`
}
