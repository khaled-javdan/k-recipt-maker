"use client"

import { savePriceList } from "@/actions/documents"
import type { CatalogItem, PriceList } from "@/lib/types"

import { DeductionEditor } from "./deduction-editor"

export function PriceListEditor({
  priceList,
  catalog,
}: {
  priceList: PriceList | null
  catalog: CatalogItem[]
}) {
  return (
    <DeductionEditor
      kind="PRICE"
      document={priceList}
      catalog={catalog}
      onSave={(input) =>
        savePriceList(priceList?.id ?? null, {
          title: input.title,
          date: input.date,
          basketCount: input.basketCount,
          commission: input.commission,
          commissionIsPercent: input.commissionIsPercent,
          notes: input.notes,
          items: input.items.map((i) => ({ name: i.name, price: i.price ?? 0 })),
          expenses: input.expenses,
        })
      }
    />
  )
}
