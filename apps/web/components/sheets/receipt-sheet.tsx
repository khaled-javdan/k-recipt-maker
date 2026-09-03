import type { Ref } from "react"

import { formatTotalWeight, formatUnitWeight } from "@/lib/calc"
import { fa } from "@/lib/fa"
import type { Receipt, ReceiptColumns, Settings } from "@/lib/types"

import {
  SheetFrame,
  SheetHeader,
  SheetNotes,
  SheetTable,
  type SheetColumn,
} from "./sheet"

// فیش — the product receipt. Unlike the other three this carries no money at
// all: it records what left the floor, by count and by weight.
export function ReceiptSheet({
  ref,
  receipt,
  settings,
}: {
  ref?: Ref<HTMLDivElement>
  receipt: Receipt
  settings: Settings
}) {
  const cols: ReceiptColumns = settings.receiptColumns
  const accent = settings.primaryColor

  const totalCount = receipt.items.reduce((s, i) => s + i.quantity, 0)
  const totalWeight = receipt.items.reduce((s, i) => s + i.weight, 0)

  // The product column is always present; the rest are toggled in settings.
  const columns: SheetColumn<Receipt["items"][number]>[] = [
    {
      key: "product",
      label: fa.sheets.product,
      render: (i) => i.productName,
    },
  ]

  if (cols.sign) {
    columns.push({
      key: "sign",
      label: fa.sheets.sign,
      width: 120,
      render: (i) =>
        i.colorName || i.colorHex ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: i.colorHex,
                border: "1px solid rgba(0,0,0,.15)",
              }}
            />
            {i.colorName}
          </span>
        ) : null,
    })
  }

  if (cols.count) {
    columns.push({
      key: "count",
      label: fa.sheets.count,
      align: "end",
      width: 90,
      render: (i) => <span dir="ltr">{i.quantity}</span>,
    })
  }

  if (cols.unitWeight) {
    columns.push({
      key: "unitWeight",
      label: fa.sheets.unitWeight,
      align: "end",
      width: 110,
      render: (i) => <span dir="ltr">{formatUnitWeight(i.unitWeight)}</span>,
    })
  }

  if (cols.totalWeight) {
    columns.push({
      key: "totalWeight",
      label: fa.sheets.totalWeight,
      align: "end",
      width: 120,
      render: (i) => <span dir="ltr">{formatTotalWeight(i.weight)}</span>,
    })
  }

  return (
    <SheetFrame ref={ref} accentColor={accent}>
      <SheetHeader
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        title={fa.sheets.receiptTitle}
        number={receipt.number}
        date={receipt.date}
        subtitle={receipt.clientName ? `${fa.sheets.client}: ${receipt.clientName}` : null}
      />

      <SheetTable
        columns={columns}
        rows={receipt.items}
        accentColor={accent}
        footer={
          <tr style={{ background: "#f3f4f6", fontWeight: 700 }}>
            <td style={{ padding: "8px 10px", borderTop: `2px solid ${accent}` }}>
              {fa.common.total}
            </td>
            {cols.sign ? <td style={{ borderTop: `2px solid ${accent}` }} /> : null}
            {cols.count ? (
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "end",
                  borderTop: `2px solid ${accent}`,
                }}
              >
                <span dir="ltr">{totalCount}</span>
              </td>
            ) : null}
            {cols.unitWeight ? <td style={{ borderTop: `2px solid ${accent}` }} /> : null}
            {cols.totalWeight ? (
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "end",
                  borderTop: `2px solid ${accent}`,
                }}
              >
                <span dir="ltr">{formatTotalWeight(totalWeight)}</span>
              </td>
            ) : null}
          </tr>
        }
      />

      <SheetNotes notes={receipt.notes} />
    </SheetFrame>
  )
}
