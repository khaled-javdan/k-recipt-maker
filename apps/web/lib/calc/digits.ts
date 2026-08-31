// Persian and Arabic-Indic numerals reach the app through phone keyboards and
// pasted text. Every numeric field normalises them before parsing, because
// Number("۱۲۳") is NaN.

const PERSIAN_ZERO = 0x06f0
const ARABIC_ZERO = 0x0660

export function toLatinDigits(input: string): string {
  let out = ""
  for (const ch of input) {
    const code = ch.codePointAt(0)!
    if (code >= PERSIAN_ZERO && code <= PERSIAN_ZERO + 9) {
      out += String(code - PERSIAN_ZERO)
    } else if (code >= ARABIC_ZERO && code <= ARABIC_ZERO + 9) {
      out += String(code - ARABIC_ZERO)
    } else {
      out += ch
    }
  }
  return out
}

// Parses a user-typed numeric field. Persian digits are normalised first, and
// anything unparseable becomes 0 rather than NaN leaking into the totals.
export function parseNumber(input: string): number {
  const n = Number(toLatinDigits(input).trim())
  return Number.isFinite(n) ? n : 0
}
