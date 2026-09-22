"use client"

import type { Ref } from "react"

import { formatAmount, ledgerBalances, ledgerClosing } from "@/lib/calc"
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

// حساب — the account sheet. The running column carries each row forward; the
// closing الباقي underneath is فاتوره minus نقدي over the whole sheet.
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
  const { cumulative } = ledgerBalances(ledger.rows)

  // Column sums for the two sides of the account, on their own band above
  // الباقي, which is their difference.
  const { invoiceTotal, cashTotal, closing } = ledgerClosing(ledger.rows)
  const showSums = cols.invoice || cols.cash

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

  // The الباقي figure belongs in the balance column. With it hidden there is no
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
          <>
            {showSums ? (
              <tr>
                <td style={footerCell({ fontWeight: 600 })}>{t.sheets.ledgerSums}</td>
                {cols.invoice ? (
                  <td style={footerCell({ numeric: true, fontWeight: 600 })}>
                    {formatAmount(invoiceTotal)}
                  </td>
                ) : null}
                {cols.commission ? <td style={footerCell()} /> : null}
                {cols.cash ? (
                  <td style={footerCell({ numeric: true, fontWeight: 600 })}>
                    {formatAmount(cashTotal)}
                  </td>
                ) : null}
                {cols.balance ? <td style={footerCell()} /> : null}
                {cols.date ? <td style={footerCell()} /> : null}
              </tr>
            ) : null}
            <tr>
              <td colSpan={labelColSpan} style={footerCell({ fontWeight: 700 })}>
                {cols.balance
                  ? t.sheets.ledgerTotal
                  : `${t.sheets.ledgerTotal}: ${formatAmount(closing)}`}
              </td>
              {cols.balance ? (
                <td style={footerCell({ numeric: true, fontWeight: 700, accentColor })}>
                  {formatAmount(closing)}
                </td>
              ) : null}
              {cols.balance && cols.date ? <td style={footerCell()} /> : null}
            </tr>
          </>
        }
      />

      <SheetNotes notes={ledger.notes} />
    </SheetFrame>
  )
}
