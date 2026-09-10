"use client"

import type { Ref } from "react"

import { formatAmount, formatMoney, ledgerBalances } from "@/lib/calc"
import { useT } from "@/components/i18n-provider"
import type { Ledger, Settings } from "@/lib/types"

import {
  SheetFrame,
  SheetHeader,
  SheetNotes,
  SheetTable,
  footerCell,
  formatLongDate,
  formatShortDate,
  type SheetColumn,
} from "./sheet"

// حساب — the account sheet. مانده is cumulative: each row carries the previous
// rows forward, and the sheet's total is simply the last row's figure.
export function LedgerSheet({
  ref,
  ledger,
  settings,
}: {
  ref?: Ref<HTMLDivElement>
  ledger: Ledger
  settings: Settings
}) {
  const t = useT()

  const cols = settings.ledgerColumns
  const { primaryColor, accentColor } = settings
  const { cumulative, grandTotal } = ledgerBalances(ledger.rows)

  type Row = Ledger["rows"][number]
  const columns: SheetColumn<Row>[] = [
    { key: "name", label: t.common.name, strong: true, render: (r) => r.name },
  ]

  if (cols.invoice) {
    columns.push({
      key: "invoice",
      label: t.sheets.invoice,
      numeric: true,
      render: (r) => formatAmount(r.invoice),
    })
  }
  if (cols.commission) {
    columns.push({
      key: "commission",
      label: t.sheets.commission,
      numeric: true,
      render: (r) => formatAmount(r.commission),
    })
  }
  if (cols.cash) {
    columns.push({
      key: "cash",
      label: t.sheets.cash,
      numeric: true,
      render: (r) => formatAmount(r.cash),
    })
  }
  if (cols.balance) {
    columns.push({
      key: "balance",
      label: t.sheets.balance,
      numeric: true,
      cellStyle: { fontWeight: 600, color: accentColor },
      render: (_r, i) => formatAmount(cumulative[i] ?? 0),
    })
  }
  if (cols.date) {
    columns.push({
      key: "date",
      label: t.common.date,
      cellStyle: { color: "#525252", whiteSpace: "nowrap" },
      render: (r) => (r.date ? formatShortDate(r.date) : ""),
    })
  }

  // The جمع figure belongs in the مانده column. With مانده hidden there is no
  // column to put it under, so the label carries the number itself and spans
  // the row instead.
  const preBalanceCount =
    1 + (cols.invoice ? 1 : 0) + (cols.commission ? 1 : 0) + (cols.cash ? 1 : 0)
  const labelColSpan = cols.balance
    ? preBalanceCount
    : preBalanceCount + (cols.date ? 1 : 0)

  return (
    <SheetFrame ref={ref} primaryColor={primaryColor}>
      <SheetHeader
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        icon="ledger"
        primaryColor={primaryColor}
        accentColor={accentColor}
        label={t.sheets.ledgerTitleLabel}
        value={ledger.title || `#${ledger.number}`}
        date={formatLongDate(ledger.date)}
      />

      <SheetTable
        columns={columns}
        rows={ledger.rows}
        primaryColor={primaryColor}
        rowKey={(r) => r.id}
        footer={
          <tr>
            <td colSpan={labelColSpan} style={footerCell({ fontWeight: 700 })}>
              {cols.balance
                ? t.common.total
                : `${t.common.total}: ${formatMoney(grandTotal)}`}
            </td>
            {cols.balance ? (
              <td style={footerCell({ numeric: true, fontWeight: 700, accentColor })}>
                {formatMoney(grandTotal)}
              </td>
            ) : null}
            {cols.balance && cols.date ? <td style={footerCell()} /> : null}
          </tr>
        }
      />

      <SheetNotes notes={ledger.notes} />
    </SheetFrame>
  )
}
