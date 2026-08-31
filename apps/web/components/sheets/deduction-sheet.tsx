import type { CSSProperties, ReactNode } from "react"

import { formatAmount, formatMoney } from "@/lib/calc"
import { fa } from "@/lib/fa"
import type { ExpenseItem } from "@/lib/types"

// The parts فیش مزاد and فیش من have in common: an itemised هزینه‌ها box and
// the subtotal − حق − هزینه‌ها stack beneath it.

export function ExpenseBox({
  expenses,
  accentColor,
}: {
  expenses: ExpenseItem[]
  accentColor: string
}) {
  if (expenses.length === 0) return null

  return (
    // Sized to its contents rather than the sheet, so it sits as a small block
    // beside the totals instead of a full-width band across the page.
    <div
      style={{
        marginTop: 16,
        border: `1px solid ${accentColor}22`,
        borderRadius: 6,
        padding: "10px 12px",
        width: "fit-content",
        minWidth: 240,
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{fa.sheets.expenses}</div>
      {expenses.map((e) => (
        <div
          key={e.id}
          style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "2px 0" }}
        >
          <span>{e.label}</span>
          <span dir="ltr">{formatAmount(e.amount)}</span>
        </div>
      ))}
    </div>
  )
}

/** Subtotal, حق and هزینه‌ها as deductions, then the net figure. */
export function DeductionTotals({
  subtotal,
  commission,
  expenses,
  grandTotal,
  accentColor,
  extra,
}: {
  subtotal: number
  commission: number
  expenses: number
  grandTotal: number
  accentColor: string
  extra?: ReactNode
}) {
  const row: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    padding: "5px 10px",
    fontSize: 13,
  }

  return (
    <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-start" }}>
      <div style={{ minWidth: 280 }}>
        {extra}
        <div style={row}>
          <span>{fa.sheets.subtotal}</span>
          <span dir="ltr">{formatAmount(subtotal)}</span>
        </div>
        {commission ? (
          <div style={row}>
            <span>{fa.sheets.commission}</span>
            <span dir="ltr">−{formatAmount(commission)}</span>
          </div>
        ) : null}
        {expenses ? (
          <div style={row}>
            <span>{fa.sheets.expenses}</span>
            <span dir="ltr">−{formatAmount(expenses)}</span>
          </div>
        ) : null}
        <div
          style={{
            ...row,
            fontSize: 15,
            fontWeight: 700,
            borderTop: `2px solid ${accentColor}`,
            marginTop: 4,
            paddingTop: 8,
          }}
        >
          <span>{fa.sheets.grandTotal}</span>
          <span dir="ltr">{formatMoney(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}
