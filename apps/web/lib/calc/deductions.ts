import { snapToFive } from "./money"

// حق (commission) and هزینه‌ها (expenses) are both *deducted* from the items
// subtotal. Two document types share this shape: فیش مزاد prices its lines
// directly, فیش من derives them from weight — but the deductions are identical,
// so they share one calculation.

export type DeductionInput = {
  /** Line amounts, already derived. */
  lineAmounts: number[]
  commission?: number
  commissionIsPercent?: boolean
  expenses?: { amount: number }[]
}

export type DeductionTotals = {
  subtotal: number
  commission: number
  expenses: number
  grandTotal: number
}

export function deductionTotals(input: DeductionInput): DeductionTotals {
  const subtotal = input.lineAmounts.reduce((sum, n) => sum + (n || 0), 0)

  // حق is settled in cash like everything else on the sheet, so a percentage of
  // an odd subtotal (2.5% of 1470 is 36.75) snaps to the nearest five rather
  // than printing a figure nobody can hand over.
  const rawCommission = input.commission ?? 0
  const commission = snapToFive(
    input.commissionIsPercent ? (subtotal * rawCommission) / 100 : rawCommission
  )

  const expenses = (input.expenses ?? []).reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  )

  return { subtotal, commission, expenses, grandTotal: subtotal - commission - expenses }
}
