// FROZEN SNAPSHOT — do not edit, do not import from application code.
//
// This is the original receipt-maker's calculation code, copied verbatim from
// src/lib/formatters.ts and src/lib/digits.ts at commit 794b024. It exists so
// legacy-parity.test.ts can run the rewrite and the original against the same
// inputs and assert they agree. When the two disagree, the rewrite is wrong.

const MAN_KG = 4

export function formatUnitWeight(value: number): string {
  if (!isFinite(value)) return ""
  return stripTrailing(value.toFixed(2))
}

export function formatTotalWeight(kg: number): string {
  if (!isFinite(kg)) return ""
  return `${stripTrailing(kg.toFixed(2))} kg`
}

function stripTrailing(s: string): string {
  if (!s.includes(".")) return s
  return s.replace(/0+$/, "").replace(/\.$/, "")
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

export function formatMoney(value: number): string {
  if (!isFinite(value)) return "AED 0"
  return `AED ${moneyFormatter.format(value)}`
}

export function formatAmount(value: number): string {
  if (!isFinite(value)) return "0"
  return moneyFormatter.format(value)
}

// ── فيش من (man receipt) math ───────────────────────────────────────────────
// Rates are quoted per من (4 kg), so a line's amount is the weight converted
// into من and multiplied by the rate. Odd weights against an odd rate land on
// amounts nobody settles in cash (23 kg at 24/kg is 552), so the amount — not
// the rate the seller quoted — is what snaps to the nearest 5.

export function manLineAmount(item: { weight: number; pricePerMan: number }): number {
  return snapToFive(((item.weight || 0) / MAN_KG) * (item.pricePerMan || 0))
}

// Rates are entered per کیلو in the editor but stored and printed per من, so the
// two converters below bracket the editor: kg in on load, man out on save.
export function pricePerKg(pricePerManRate: number): number {
  return (pricePerManRate || 0) / MAN_KG
}

export function pricePerManFromKg(pricePerKgRate: number): number {
  return (pricePerKgRate || 0) * MAN_KG
}

// Same deductions as a fish receipt, plus the total weight the sheet is sold by.
export function manReceiptTotals(mr: {
  items: { weight: number; pricePerMan: number }[]
  commission?: number
  commissionIsPercent?: boolean
  expenseItems?: { amount: number }[]
}): {
  subtotal: number
  commission: number
  expenses: number
  grandTotal: number
  totalWeight: number
} {
  const totals = priceListTotals({
    ...mr,
    items: mr.items.map((it) => ({ price: manLineAmount(it) })),
  })
  const totalWeight = mr.items.reduce((sum, it) => sum + (it.weight || 0), 0)
  return { ...totals, totalWeight }
}

// Item prices are always quoted in multiples of 5 — 31 and 57 aren't real
// market prices. Applied when a price field loses focus, never mid-typing, so
// entering "57" isn't fought keystroke by keystroke.
export function snapToFive(value: number): number {
  if (!isFinite(value)) return 0
  return Math.round(value / 5) * 5
}

// String-in/string-out wrapper for the price inputs. Blank stays blank, and
// anything unparseable is left alone rather than silently zeroed.
export function snapPriceInput(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  const n = Number(trimmed)
  if (!isFinite(n)) return raw
  return String(snapToFive(n))
}

export function rowBalance(row: {
  invoice: number
  commission: number
  cash: number
}): number {
  return row.invoice + row.commission - row.cash
}

// Flow items into columns column-major (fill the first column top-to-bottom,
// then the next) so the printed sheet reads like a hand-written ledger. A new
// column is added each time an existing one fills past `itemsPerColumn`, capped
// at `maxColumns`. Beyond that cap the columns simply grow taller.
export function layoutColumns<T>(
  items: T[],
  itemsPerColumn: number,
  maxColumns: number
): T[][] {
  const count = items.length
  if (count === 0) return [[]]
  const perCol = Math.max(1, Math.floor(itemsPerColumn) || 1)
  const cap = Math.max(1, Math.floor(maxColumns) || 1)
  const columns = Math.min(Math.ceil(count / perCol), cap)
  const balanced = Math.ceil(count / columns)
  const result: T[][] = []
  for (let i = 0; i < count; i += balanced) {
    result.push(items.slice(i, i + balanced))
  }
  return result
}

// Shared money math for a fish receipt: subtotal of items, then حق (commission,
// flat or % of subtotal) and هزینه‌ها (expenses, flat) are both deducted.
export function priceListTotals(pl: {
  items: { price: number }[]
  commission?: number
  commissionIsPercent?: boolean
  expenseItems?: { amount: number }[]
  expenses?: number
}): { subtotal: number; commission: number; expenses: number; grandTotal: number } {
  const subtotal = pl.items.reduce((sum, it) => sum + (it.price || 0), 0)
  const rawCommission = pl.commission ?? 0
  // حق is settled in cash like everything else on the sheet, so a percentage of
  // an odd subtotal (2.5% of 1470 is 36.75) snaps to the nearest 5 rather than
  // printing a figure nobody can hand over.
  const commission = snapToFive(
    pl.commissionIsPercent ? (subtotal * rawCommission) / 100 : rawCommission
  )
  const expenses =
    pl.expenseItems && pl.expenseItems.length
      ? pl.expenseItems.reduce((sum, e) => sum + (e.amount || 0), 0)
      : (pl.expenses ?? 0)
  const grandTotal = subtotal - commission - expenses
  return { subtotal, commission, expenses, grandTotal }
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"

export function toLatinDigits(input: string): string {
  let out = ""
  for (const ch of input) {
    const pIdx = PERSIAN_DIGITS.indexOf(ch)
    if (pIdx !== -1) {
      out += String(pIdx)
      continue
    }
    const aIdx = ARABIC_DIGITS.indexOf(ch)
    if (aIdx !== -1) {
      out += String(aIdx)
      continue
    }
    out += ch
  }
  return out
}
