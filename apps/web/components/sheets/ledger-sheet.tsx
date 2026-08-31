import type { Ref } from "react"

import { formatAmount, ledgerBalances } from "@/lib/calc"
import { fa } from "@/lib/fa"
import { formatSheetDate } from "./sheet"
import type { Ledger, Settings } from "@/lib/types"

import { SheetFrame, SheetHeader, SheetNotes, SheetTable, type SheetColumn } from "./sheet"

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
  const cols = settings.ledgerColumns
  const accent = settings.primaryColor
  const { cumulative, grandTotal } = ledgerBalances(ledger.rows)

  type Row = Ledger["rows"][number]
  const columns: SheetColumn<Row>[] = [
    { key: "name", label: fa.common.name, render: (r) => r.name },
  ]

  if (cols.invoice) {
    columns.push({
      key: "invoice",
      label: fa.sheets.invoice,
      align: "end",
      width: 110,
      render: (r) => <span dir="ltr">{formatAmount(r.invoice)}</span>,
    })
  }
  if (cols.commission) {
    columns.push({
      key: "commission",
      label: fa.sheets.commission,
      align: "end",
      width: 100,
      render: (r) => <span dir="ltr">{formatAmount(r.commission)}</span>,
    })
  }
  if (cols.cash) {
    columns.push({
      key: "cash",
      label: fa.sheets.cash,
      align: "end",
      width: 110,
      render: (r) => <span dir="ltr">{formatAmount(r.cash)}</span>,
    })
  }
  if (cols.balance) {
    columns.push({
      key: "balance",
      label: fa.sheets.balance,
      align: "end",
      width: 110,
      render: (_r, i) => <span dir="ltr">{formatAmount(cumulative[i] ?? 0)}</span>,
    })
  }
  if (cols.date) {
    columns.push({
      key: "date",
      label: fa.common.date,
      align: "end",
      width: 110,
      render: (r) => <span dir="ltr">{r.date ? formatSheetDate(r.date) : ""}</span>,
    })
  }

  // Where the grand total sits depends on which columns are switched on: it
  // goes under مانده when that column is shown, otherwise under the last
  // money column, with any trailing date column left blank.
  const totalIndex = columns.findIndex((c) => c.key === "balance")
  const valueIndex = totalIndex === -1 ? columns.length - 1 : totalIndex
  const labelSpan = valueIndex
  const trailingSpan = columns.length - valueIndex - 1

  return (
    <SheetFrame ref={ref} accentColor={accent}>
      <SheetHeader
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        title={ledger.title || fa.sheets.ledgerTitle}
        number={ledger.number}
        date={ledger.date}
      />

      <SheetTable
        columns={columns}
        rows={ledger.rows}
        accentColor={accent}
        footer={
          <tr style={{ background: "#f3f4f6", fontWeight: 700 }}>
            {/* The total belongs under مانده, so the label spans the columns
                before it and the date column (if shown) stays empty after. */}
            <td
              colSpan={labelSpan}
              style={{ padding: "8px 10px", borderTop: `2px solid ${accent}` }}
            >
              {fa.common.total}
            </td>
            <td
              dir="ltr"
              style={{
                padding: "8px 10px",
                textAlign: "end",
                borderTop: `2px solid ${accent}`,
              }}
            >
              {formatAmount(grandTotal)}
            </td>
            {trailingSpan > 0 ? (
              <td colSpan={trailingSpan} style={{ borderTop: `2px solid ${accent}` }} />
            ) : null}
          </tr>
        }
      />

      <SheetNotes notes={ledger.notes} />
    </SheetFrame>
  )
}
