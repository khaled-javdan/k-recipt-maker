import type { Ref } from "react"

import { deductionTotals, formatAmount, layoutColumns } from "@/lib/calc"
import { fa } from "@/lib/fa"
import type { PriceList, Settings } from "@/lib/types"

import { DeductionFooter, commissionLabel } from "./deduction-sheet"
import { SheetFrame, SheetHeader, SheetNotes, formatSheetDate } from "./sheet"

// فیش مزاد — the auction sheet. Items flow column-major so the printed page
// reads like the hand-written original: fill the first column top to bottom,
// then start the next. Each column is its own bordered table sitting in a grid,
// which is what keeps the columns aligned when they hold uneven counts.
export function PriceListSheet({
  ref,
  priceList,
  settings,
}: {
  ref?: Ref<HTMLDivElement>
  priceList: PriceList
  settings: Settings
}) {
  const { primaryColor, accentColor } = settings
  const { itemsPerColumn, maxColumns } = settings.priceListConfig

  const totals = deductionTotals({
    lineAmounts: priceList.items.map((i) => i.price),
    commission: priceList.commission ?? undefined,
    commissionIsPercent: priceList.commissionIsPercent,
    expenses: priceList.expenses,
  })

  const columns = layoutColumns(priceList.items, itemsPerColumn, maxColumns)

  return (
    <SheetFrame ref={ref} primaryColor={primaryColor}>
      <SheetHeader
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        icon="priceList"
        primaryColor={primaryColor}
        accentColor={accentColor}
        label={fa.sheets.listTitleLabel}
        value={priceList.title || `#${priceList.number}`}
        date={formatSheetDate(priceList.date)}
        subline={
          priceList.basketCount
            ? `${fa.sheets.basketCount} : ${priceList.basketCount}`
            : null
        }
      />

      <div
        style={{
          marginTop: "28px",
          display: "grid",
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
          gap: "0 24px",
          alignItems: "start",
        }}
      >
        {columns.map((column, ci) => (
          <table
            key={ci}
            style={{
              width: "100%",
              fontSize: "13px",
              borderCollapse: "separate",
              borderSpacing: 0,
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid #e5e5e5",
            }}
          >
            <thead>
              <tr style={{ background: primaryColor, color: "#ffffff" }}>
                <th style={{ padding: "8px 12px", textAlign: "start", fontWeight: 600 }}>
                  {fa.sheets.item}
                </th>
                <th style={{ padding: "8px 12px", textAlign: "end", fontWeight: 600 }}>
                  {fa.sheets.price}
                </th>
              </tr>
            </thead>
            <tbody>
              {column.map((item, i) => {
                const cellStyle = {
                  padding: "7px 12px",
                  background: i % 2 === 0 ? "#fafafa" : "#ffffff",
                  borderBottom: "1px solid #ececec",
                } as const
                return (
                  <tr key={item.id}>
                    <td style={{ ...cellStyle, fontWeight: 500 }}>{item.name}</td>
                    <td
                      style={{
                        ...cellStyle,
                        textAlign: "end",
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatAmount(item.price)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ))}
      </div>

      <DeductionFooter
        expenses={priceList.expenses}
        expensesTotal={totals.expenses}
        subtotal={totals.subtotal}
        commission={totals.commission}
        commissionLabel={commissionLabel(
          priceList.commission,
          priceList.commissionIsPercent
        )}
        grandTotal={totals.grandTotal}
        primaryColor={primaryColor}
        accentColor={accentColor}
      />

      <SheetNotes notes={priceList.notes} />
    </SheetFrame>
  )
}
