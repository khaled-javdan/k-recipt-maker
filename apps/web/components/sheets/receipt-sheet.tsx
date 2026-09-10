"use client"

import type { Ref } from "react"

import { formatTotalWeight, formatUnitWeight } from "@/lib/calc"
import { useT } from "@/components/i18n-provider"
import type { Receipt, ReceiptColumns, Settings } from "@/lib/types"

import {
  SheetFrame,
  SheetHeader,
  SheetNotes,
  SheetTable,
  footerCell,
  formatLongDate,
  labelStyle,
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
  const t = useT()

  const cols: ReceiptColumns = settings.receiptColumns
  const { primaryColor, accentColor } = settings

  const totalCount = receipt.items.reduce((s, i) => s + i.quantity, 0)
  const totalWeight = receipt.items.reduce((s, i) => s + i.weight, 0)

  // The جمع label runs under the product column, plus علامت when it is shown.
  const labelColSpan = 1 + (cols.sign ? 1 : 0)

  // The product column is always present; the rest are toggled in settings.
  const columns: SheetColumn<Receipt["items"][number]>[] = [
    {
      key: "product",
      label: t.sheets.product,
      strong: true,
      render: (i) => i.productName,
    },
  ]

  if (cols.sign) {
    columns.push({
      key: "sign",
      label: t.sheets.sign,
      render: (i) =>
        i.colorName || i.colorHex ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                borderRadius: "9999px",
                background: i.colorHex,
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            />
            <span>{i.colorName}</span>
          </span>
        ) : null,
    })
  }

  if (cols.count) {
    columns.push({
      key: "count",
      label: t.sheets.count,
      numeric: true,
      render: (i) => i.quantity,
    })
  }

  if (cols.unitWeight) {
    columns.push({
      key: "unitWeight",
      label: t.sheets.unitWeight,
      numeric: true,
      render: (i) => formatUnitWeight(i.unitWeight),
    })
  }

  if (cols.totalWeight) {
    columns.push({
      key: "totalWeight",
      label: t.sheets.totalWeight,
      numeric: true,
      cellStyle: { fontWeight: 500 },
      // Bare figures down the column; only the جمع band carries the unit.
      render: (i) => formatUnitWeight(i.weight),
    })
  }

  return (
    <SheetFrame ref={ref} primaryColor={primaryColor}>
      <SheetHeader
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        icon="receipt"
        primaryColor={primaryColor}
        accentColor={accentColor}
        label={t.sheets.receiptNumberLabel}
        value={`#${receipt.number}`}
        valueWeight={600}
        tabularValue
        date={formatLongDate(receipt.date)}
      />

      {/* The client sits on its own line under the rule rather than in the
          masthead — it is the one field a reader looks for first. */}
      <div style={{ marginTop: "20px", fontSize: "14px" }}>
        <div style={labelStyle}>{t.sheets.client}</div>
        <div style={{ marginTop: "2px", fontSize: "16px", fontWeight: 500 }}>
          {receipt.clientName || t.sheets.noClient}
        </div>
      </div>

      <SheetTable
        columns={columns}
        rows={receipt.items}
        primaryColor={primaryColor}
        rowKey={(i) => i.id}
        footer={
          <tr>
            <td colSpan={labelColSpan} style={footerCell({ fontWeight: 600 })}>
              {t.common.total}
            </td>
            {cols.count ? (
              <td style={footerCell({ numeric: true, fontWeight: 700, accentColor })}>
                {totalCount}
              </td>
            ) : null}
            {cols.unitWeight ? <td style={footerCell()} /> : null}
            {cols.totalWeight ? (
              <td style={footerCell({ numeric: true, fontWeight: 700, accentColor })}>
                {formatTotalWeight(totalWeight)}
              </td>
            ) : null}
          </tr>
        }
      />

      <SheetNotes notes={receipt.notes} />
    </SheetFrame>
  )
}
