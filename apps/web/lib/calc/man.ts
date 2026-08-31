import { deductionTotals, type DeductionTotals } from "./deductions"
import { snapToFive } from "./money"

/** One من — the Iranian market unit fish rates are quoted in. */
export const MAN_KG = 4

export type ManLine = {
  weight: number
  pricePerMan: number
}

// Odd weights against an odd rate land on amounts nobody settles in cash, so
// the *amount* snaps to five — not the rate the seller quoted.
export function manLineAmount(line: ManLine): number {
  return snapToFive(((line.weight || 0) / MAN_KG) * (line.pricePerMan || 0))
}

// Rates are entered per کیلو in the editor but stored and printed per من, so
// these two bracket the editor: kg in on load, من out on save.
export function pricePerKg(pricePerManRate: number): number {
  return (pricePerManRate || 0) / MAN_KG
}

export function pricePerManFromKg(pricePerKgRate: number): number {
  return (pricePerKgRate || 0) * MAN_KG
}

export function manReceiptTotals(input: {
  items: ManLine[]
  commission?: number
  commissionIsPercent?: boolean
  expenses?: { amount: number }[]
}): DeductionTotals & { totalWeight: number } {
  const totals = deductionTotals({
    lineAmounts: input.items.map(manLineAmount),
    commission: input.commission,
    commissionIsPercent: input.commissionIsPercent,
    expenses: input.expenses,
  })
  const totalWeight = input.items.reduce((sum, it) => sum + (it.weight || 0), 0)
  return { ...totals, totalWeight }
}
