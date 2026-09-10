"use client"

import type { Ref } from "react"

import {
  formatAmount,
  formatTotalWeight,
  formatUnitWeight,
  manLineAmount,
  manReceiptTotals,
} from "@/lib/calc"
import { useT } from "@/components/i18n-provider"
import type { ManReceipt, Settings } from "@/lib/types"

import { DeductionFooter, TotalLine, commissionLabel } from "./deduction-sheet"
import {
  SheetFrame,
  SheetHeader,
  SheetNotes,
  SheetTable,
  footerCell,
  formatSheetDate,
  type SheetColumn,
} from "./sheet"

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
  const t = useT()

  const { primaryColor, accentColor } = settings

  const totals = manReceiptTotals({
    items: manReceipt.items,
    commission: manReceipt.commission ?? undefined,
    commissionIsPercent: manReceipt.commissionIsPercent,
    expenses: manReceipt.expenses,
  })

  type Row = ManReceipt["items"][number]
  const columns: SheetColumn<Row>[] = [
    { key: "name", label: t.sheets.item, strong: true, render: (i) => i.name },
    {
      key: "weight",
      label: t.sheets.weightKg,
      numeric: true,
      render: (i) => formatUnitWeight(i.weight),
    },
    {
      key: "rate",
      label: t.sheets.pricePerMan,
      numeric: true,
      render: (i) => formatAmount(i.pricePerMan),
    },
    {
      key: "amount",
      label: t.sheets.amount,
      numeric: true,
      cellStyle: { fontWeight: 600 },
      render: (i) => formatAmount(manLineAmount(i)),
    },
  ]

  const cellPadding = "10px 14px"
  const footerPadding = "12px 14px"

  return (
    <SheetFrame ref={ref} primaryColor={primaryColor}>
      <SheetHeader
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        icon="manReceipt"
        primaryColor={primaryColor}
        accentColor={accentColor}
        label={t.sheets.listTitleLabel}
        value={manReceipt.title || `#${manReceipt.number}`}
        date={formatSheetDate(manReceipt.date)}
        subline={
          manReceipt.basketCount
            ? `${t.sheets.basketCount} : ${manReceipt.basketCount}`
            : null
        }
      />

      <SheetTable
        columns={columns}
        rows={manReceipt.items}
        primaryColor={primaryColor}
        fontSize="13px"
        cellPadding={cellPadding}
        tightNumerics
        rowKey={(i) => i.id}
        footer={
          <tr>
            <td style={footerCell({ fontWeight: 600, padding: footerPadding })}>
              {t.common.total}
            </td>
            <td
              style={footerCell({
                numeric: true,
                nowrap: true,
                fontWeight: 700,
                accentColor,
                padding: footerPadding,
              })}
            >
              {formatTotalWeight(totals.totalWeight)}
            </td>
            <td style={footerCell({ padding: footerPadding })} />
            <td
              style={footerCell({
                numeric: true,
                nowrap: true,
                fontWeight: 700,
                accentColor,
                padding: footerPadding,
              })}
            >
              {formatAmount(totals.subtotal)}
            </td>
          </tr>
        }
      />

      <DeductionFooter
        expenses={manReceipt.expenses}
        expensesTotal={totals.expenses}
        subtotal={totals.subtotal}
        commission={totals.commission}
        commissionLabel={commissionLabel(t, 
          manReceipt.commission,
          manReceipt.commissionIsPercent
        )}
        grandTotal={totals.grandTotal}
        primaryColor={primaryColor}
        accentColor={accentColor}
        leadingTotal={
          <TotalLine
            label={t.sheets.totalWeight}
            value={formatTotalWeight(totals.totalWeight)}
          />
        }
      />

      <SheetNotes notes={manReceipt.notes} />
    </SheetFrame>
  )
}
