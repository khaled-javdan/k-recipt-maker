import type { Ref } from "react"

import {
  formatAmount,
  formatTotalWeight,
  formatUnitWeight,
  manLineAmount,
  manReceiptTotals,
  pricePerKg,
} from "@/lib/calc"
import { fa } from "@/lib/fa"
import type { ManReceipt, Settings } from "@/lib/types"

import { DeductionTotals, ExpenseBox } from "./deduction-sheet"
import { SheetFrame, SheetHeader, SheetNotes, SheetTable, type SheetColumn } from "./sheet"

// فیش من — the same deductions as the auction sheet, but each line is priced
// by weight against a per-من rate. The line amount is derived, never stored.
export function ManReceiptSheet({
  ref,
  manReceipt,
  settings,
}: {
  ref?: Ref<HTMLDivElement>
  manReceipt: ManReceipt
  settings: Settings
}) {
  const accent = settings.primaryColor

  const totals = manReceiptTotals({
    items: manReceipt.items,
    commission: manReceipt.commission ?? undefined,
    commissionIsPercent: manReceipt.commissionIsPercent,
    expenses: manReceipt.expenses,
  })

  type Row = ManReceipt["items"][number]
  const columns: SheetColumn<Row>[] = [
    { key: "name", label: fa.sheets.item, render: (i) => i.name },
    {
      key: "weight",
      label: fa.sheets.weightKg,
      align: "end",
      width: 110,
      render: (i) => <span dir="ltr">{formatUnitWeight(i.weight)}</span>,
    },
    {
      key: "rate",
      label: fa.sheets.pricePerMan,
      align: "end",
      width: 110,
      render: (i) => <span dir="ltr">{formatAmount(i.pricePerMan)}</span>,
    },
    {
      key: "perKg",
      label: fa.sheets.pricePerKg,
      align: "end",
      width: 100,
      render: (i) => <span dir="ltr">{formatAmount(pricePerKg(i.pricePerMan))}</span>,
    },
    {
      key: "amount",
      label: fa.sheets.amount,
      align: "end",
      width: 110,
      render: (i) => <span dir="ltr">{formatAmount(manLineAmount(i))}</span>,
    },
  ]

  return (
    <SheetFrame ref={ref} accentColor={accent}>
      <SheetHeader
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        title={manReceipt.title || fa.sheets.manReceiptTitle}
        number={manReceipt.number}
        date={manReceipt.date}
        subtitle={
          manReceipt.basketCount
            ? `${fa.sheets.basketCount}: ${manReceipt.basketCount}`
            : null
        }
      />

      <SheetTable columns={columns} rows={manReceipt.items} accentColor={accent} />

      <ExpenseBox expenses={manReceipt.expenses} accentColor={accent} />

      <DeductionTotals
        subtotal={totals.subtotal}
        commission={totals.commission}
        expenses={totals.expenses}
        grandTotal={totals.grandTotal}
        accentColor={accent}
        extra={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              padding: "5px 10px",
              fontSize: 13,
            }}
          >
            <span>{fa.sheets.totalWeight}</span>
            <span dir="ltr">{formatTotalWeight(totals.totalWeight)}</span>
          </div>
        }
      />

      <SheetNotes notes={manReceipt.notes} />
    </SheetFrame>
  )
}
