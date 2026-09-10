"use client"

import type { ReactNode } from "react"

import { formatAmount, formatMoney } from "@/lib/calc"
import { useT } from "@/components/i18n-provider"
import type { Dictionary } from "@/lib/i18n"
import type { ExpenseItem } from "@/lib/types"

// The block فیش مزاد and فیش من share below their tables: the itemised هزینه‌ها
// box on the leading edge and the subtotal − حق − هزینه‌ها stack on the other,
// closing on the خالص figure.

const MUTED = "#525252"
const HAIRLINE = "#e5e5e5"

/**
 * The two sit on one row facing apart, so on an RTL sheet the costs land on the
 * right and the totals on the left. With no cost lines the spacer keeps the
 * totals where they belong instead of letting them slide across.
 */
export function DeductionFooter({
  expenses,
  expensesTotal,
  subtotal,
  commission,
  commissionLabel,
  grandTotal,
  primaryColor,
  accentColor,
  leadingTotal,
}: {
  expenses: ExpenseItem[]
  expensesTotal: number
  subtotal: number
  commission: number
  commissionLabel: string
  grandTotal: number
  primaryColor: string
  accentColor: string
  /** فیش من opens its stack with the total weight. */
  leadingTotal?: ReactNode
}) {
  const t = useT()

  return (
    <div
      style={{
        marginTop: "24px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "24px",
      }}
    >
      {expenses.length ? (
        <div
          style={{
            border: `1px solid ${HAIRLINE}`,
            borderRadius: "8px",
            padding: "10px 0",
            minWidth: "200px",
            fontSize: "13px",
          }}
        >
          {expenses.map((e) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "16px",
                padding: "5px 16px",
                color: MUTED,
              }}
            >
              <span>{e.label || t.sheets.expenses}</span>
              <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {formatAmount(e.amount)}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "16px",
              marginTop: "4px",
              padding: "8px 16px 2px",
              borderTop: `1px solid ${HAIRLINE}`,
              fontWeight: 700,
            }}
          >
            <span>{t.sheets.expenses}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              {formatAmount(expensesTotal)}
            </span>
          </div>
        </div>
      ) : (
        <div />
      )}

      <div style={{ width: "320px", maxWidth: "100%" }}>
        {leadingTotal}
        <TotalLine label={t.sheets.subtotal} value={formatAmount(subtotal)} />
        {commission ? (
          <TotalLine label={commissionLabel} value={`− ${formatAmount(commission)}`} />
        ) : null}
        {expensesTotal ? (
          <TotalLine label={t.sheets.expenses} value={`− ${formatAmount(expensesTotal)}`} />
        ) : null}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "16px",
            marginTop: "6px",
            background: "#f5f5f5",
            borderTop: `2px solid ${primaryColor}`,
            padding: "12px 16px",
            borderRadius: "6px",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700 }}>{t.sheets.grandTotal}</span>
          <span
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: accentColor,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatMoney(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: "16px",
        padding: "6px 16px",
        fontSize: "14px",
        color: MUTED,
      }}
    >
      <span>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {value}
      </span>
    </div>
  )
}

/** حق reads as "حق (۵٪)" when it was entered as a percentage. */
export function commissionLabel(
  t: Dictionary,
  commission: number | null | undefined,
  isPercent: boolean
): string {
  return isPercent && commission
    ? `${t.sheets.commission} (${commission}${t.sheets.percent})`
    : t.sheets.commission
}
