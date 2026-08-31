"use client"

import { saveManReceipt } from "@/actions/documents"
import type { CatalogItem, ManReceipt } from "@/lib/types"

import { DeductionEditor } from "./deduction-editor"

export function ManReceiptEditor({
  manReceipt,
  catalog,
}: {
  manReceipt: ManReceipt | null
  catalog: CatalogItem[]
}) {
  return (
    <DeductionEditor
      kind="MAN"
      document={manReceipt}
      catalog={catalog}
      onSave={(input) =>
        saveManReceipt(manReceipt?.id ?? null, {
          title: input.title,
          date: input.date,
          basketCount: input.basketCount,
          commission: input.commission,
          commissionIsPercent: input.commissionIsPercent,
          notes: input.notes,
          items: input.items.map((i) => ({
            name: i.name,
            weight: i.weight ?? 0,
            pricePerMan: i.pricePerMan ?? 0,
          })),
          expenses: input.expenses,
        })
      }
    />
  )
}
