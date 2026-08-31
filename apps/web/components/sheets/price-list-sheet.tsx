import type { Ref } from "react"

import { deductionTotals, formatAmount, layoutColumns } from "@/lib/calc"
import { fa } from "@/lib/fa"
import type { PriceList, Settings } from "@/lib/types"

import { DeductionTotals, ExpenseBox } from "./deduction-sheet"
import { SheetFrame, SheetHeader, SheetNotes } from "./sheet"

// فیش مزاد — the auction sheet. Items flow column-major so the printed page
// reads like the hand-written original: fill the first column top to bottom,
// then start the next.
export function PriceListSheet({
  ref,
  priceList,
  settings,
}: {
  ref?: Ref<HTMLDivElement>
  priceList: PriceList
  settings: Settings
}) {
  const accent = settings.primaryColor
  const { itemsPerColumn, maxColumns } = settings.priceListConfig

  const totals = deductionTotals({
    lineAmounts: priceList.items.map((i) => i.price),
    commission: priceList.commission ?? undefined,
    commissionIsPercent: priceList.commissionIsPercent,
    expenses: priceList.expenses,
  })

  const columns = layoutColumns(priceList.items, itemsPerColumn, maxColumns)

  return (
    <SheetFrame ref={ref} accentColor={accent}>
      <SheetHeader
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        title={priceList.title || fa.sheets.priceListTitle}
        number={priceList.number}
        date={priceList.date}
        subtitle={
          priceList.basketCount
            ? `${fa.sheets.basketCount}: ${priceList.basketCount}`
            : null
        }
      />

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {columns.map((column, ci) => (
          <table
            key={ci}
            style={{
              flex: 1,
              borderCollapse: "collapse",
              fontSize: 12.5,
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th
                  style={{
                    textAlign: "start",
                    padding: "6px 8px",
                    borderBottom: `2px solid ${accent}`,
                    fontWeight: 700,
                  }}
                >
                  {fa.sheets.item}
                </th>
                <th
                  style={{
                    textAlign: "end",
                    padding: "6px 8px",
                    borderBottom: `2px solid ${accent}`,
                    fontWeight: 700,
                    width: 80,
                  }}
                >
                  {fa.sheets.price}
                </th>
              </tr>
            </thead>
            <tbody>
              {column.map((item, i) => (
                <tr key={item.id} style={{ background: i % 2 ? "#fafafa" : "#ffffff" }}>
                  <td
                    style={{
                      padding: "5px 8px",
                      borderBottom: "1px solid #e5e7eb",
                      wordBreak: "break-word",
                    }}
                  >
                    {item.name}
                  </td>
                  <td
                    dir="ltr"
                    style={{
                      padding: "5px 8px",
                      textAlign: "end",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {formatAmount(item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>

      <ExpenseBox expenses={priceList.expenses} accentColor={accent} />

      <DeductionTotals
        subtotal={totals.subtotal}
        commission={totals.commission}
        expenses={totals.expenses}
        grandTotal={totals.grandTotal}
        accentColor={accent}
      />

      <SheetNotes notes={priceList.notes} />
    </SheetFrame>
  )
}
