"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@workspace/db"

import { catalogKey, normalizeName } from "@/lib/catalog-key"
import { requireAdmin } from "@/lib/dal"
import { backupSchema } from "@/lib/import-schema"

export type ImportResult = {
  error?: string
  summary?: Record<string, number>
}

// One-time migration from the old localStorage app. Everything lands in a
// single transaction: a partial import would leave the user unable to tell
// what made it across.
//
// Re-running replaces rather than duplicates, so a failed attempt can simply
// be retried.
export async function importBackup(json: string): Promise<ImportResult> {
  const admin = await requireAdmin()

  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { error: "فایل JSON خوانده نشد" }
  }

  const parsed = backupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: `فایل معتبر نیست: ${parsed.error.issues[0]?.message ?? ""}` }
  }

  const data = parsed.data.data
  const userId = admin.id
  const at = (ms?: number) => (ms ? new Date(ms) : new Date())

  const summary = await prisma.$transaction(
    async (tx) => {
      // Replace, don't merge: importing twice must not double every document.
      await tx.receipt.deleteMany({ where: { userId } })
      await tx.ledger.deleteMany({ where: { userId } })
      await tx.priceList.deleteMany({ where: { userId } })
      await tx.manReceipt.deleteMany({ where: { userId } })
      await tx.catalogItem.deleteMany({ where: { userId } })
      await tx.client.deleteMany({ where: { userId } })
      await tx.product.deleteMany({ where: { userId } })

      const company = data.company
      if (company) {
        await tx.settings.upsert({
          where: { userId },
          create: {
            userId,
            companyName: company.name ?? "",
            primaryColor: company.primaryColor || "#1f2937",
            accentColor: company.accentColor || "#7c3aed",
            ...(company.receiptColumns ? { receiptColumns: company.receiptColumns } : {}),
            ...(company.ledgerColumns ? { ledgerColumns: company.ledgerColumns } : {}),
            ...(company.priceListConfig ? { priceListConfig: company.priceListConfig } : {}),
          },
          update: {
            companyName: company.name ?? "",
            primaryColor: company.primaryColor || "#1f2937",
            accentColor: company.accentColor || "#7c3aed",
            ...(company.receiptColumns ? { receiptColumns: company.receiptColumns } : {}),
            ...(company.ledgerColumns ? { ledgerColumns: company.ledgerColumns } : {}),
            ...(company.priceListConfig ? { priceListConfig: company.priceListConfig } : {}),
          },
        })
      }

      // Old ids are remapped to new ones; receipts reference clients by the
      // old id, so the mapping has to be kept while inserting.
      const clientIdMap = new Map<string, string>()
      for (const client of data.clients ?? []) {
        const created = await tx.client.create({
          data: {
            userId,
            name: client.name,
            phone: client.phone || null,
            address: client.address || null,
          },
          select: { id: true },
        })
        if (client.id) clientIdMap.set(client.id, created.id)
      }

      for (const product of data.products ?? []) {
        await tx.product.create({
          data: {
            userId,
            name: product.name,
            colorName: product.colorName ?? "",
            colorHex: /^#[0-9a-fA-F]{6}$/.test(product.colorHex ?? "")
              ? product.colorHex!
              : "#9ca3af",
            unitWeight: product.unitWeight,
          },
        })
      }

      for (const receipt of data.receipts ?? []) {
        await tx.receipt.create({
          data: {
            userId,
            number: Math.round(receipt.number),
            clientId: receipt.clientId ? (clientIdMap.get(receipt.clientId) ?? null) : null,
            clientName: receipt.clientName || null,
            date: receipt.date,
            notes: receipt.notes || null,
            createdAt: at(receipt.createdAt),
            items: {
              create: receipt.items.map((item, position) => ({
                position,
                productId: null,
                productName: item.productName,
                colorName: item.colorName ?? "",
                colorHex: item.colorHex ?? "#9ca3af",
                unitWeight: item.unitWeight,
                quantity: Math.round(item.quantity),
                weight: item.weight,
              })),
            },
          },
        })
      }

      for (const ledger of data.ledgers ?? []) {
        await tx.ledger.create({
          data: {
            userId,
            number: Math.round(ledger.number),
            title: ledger.title,
            date: ledger.date,
            notes: ledger.notes || null,
            createdAt: at(ledger.createdAt),
            rows: {
              create: ledger.rows.map((row, position) => ({
                position,
                name: row.name,
                date: /^\d{4}-\d{2}-\d{2}/.test(row.date ?? "")
                  ? row.date!.slice(0, 10)
                  : null,
                invoice: row.invoice,
                commission: row.commission,
                cash: row.cash,
              })),
            },
          },
        })
      }

      // The old app had a single `expenses` amount before it grew itemised
      // lines. Anything still on the old shape becomes one line so the total
      // stays identical.
      const foldExpenses = (doc: {
        expenseItems?: { label: string; amount: number }[]
        expenses?: number | null
      }) => {
        if (doc.expenseItems?.length) {
          return doc.expenseItems.map((e, position) => ({
            position,
            label: e.label,
            amount: e.amount,
          }))
        }
        if (doc.expenses) {
          return [{ position: 0, label: "هزینه", amount: doc.expenses }]
        }
        return []
      }

      for (const priceList of data.priceLists ?? []) {
        await tx.priceList.create({
          data: {
            userId,
            number: Math.round(priceList.number),
            title: priceList.title,
            date: priceList.date,
            basketCount: priceList.basketCount ? Math.round(priceList.basketCount) : null,
            commission: priceList.commission ?? null,
            commissionIsPercent: priceList.commissionIsPercent ?? false,
            notes: priceList.notes || null,
            createdAt: at(priceList.createdAt),
            items: {
              create: priceList.items.map((item, position) => ({
                position,
                name: item.name,
                price: item.price,
              })),
            },
            expenses: { create: foldExpenses(priceList) },
          },
        })
      }

      for (const manReceipt of data.manReceipts ?? []) {
        await tx.manReceipt.create({
          data: {
            userId,
            number: Math.round(manReceipt.number),
            title: manReceipt.title,
            date: manReceipt.date,
            basketCount: manReceipt.basketCount
              ? Math.round(manReceipt.basketCount)
              : null,
            commission: manReceipt.commission ?? null,
            commissionIsPercent: manReceipt.commissionIsPercent ?? false,
            notes: manReceipt.notes || null,
            createdAt: at(manReceipt.createdAt),
            items: {
              create: manReceipt.items.map((item, position) => ({
                position,
                name: item.name,
                weight: item.weight,
                pricePerMan: item.pricePerMan,
              })),
            },
            expenses: { create: foldExpenses(manReceipt) },
          },
        })
      }

      // Two catalogs, one table. De-duplicated on the way in because the old
      // storage had no unique index and could hold the same name twice.
      let catalogStored = 0
      for (const [kind, entries] of [
        ["PRICE", data.priceCatalog ?? []],
        ["MAN", data.manCatalog ?? []],
      ] as const) {
        const seen = new Map<string, { name: string; price: number }>()
        for (const entry of entries) {
          const name = normalizeName(entry.name)
          if (!name) continue
          seen.set(catalogKey(name), { name, price: entry.price })
        }
        for (const [key, value] of seen) {
          await tx.catalogItem.create({
            data: { userId, kind, nameKey: key, name: value.name, price: value.price },
          })
          catalogStored++
        }
      }

      // Counters continue from the highest number actually imported, so the
      // next document cannot collide with an old one.
      const highest = (rows: { number: number }[] | null | undefined) =>
        Math.max(1000, ...(rows ?? []).map((r) => Math.round(r.number)))

      for (const [kind, rows] of [
        ["RECEIPT", data.receipts],
        ["LEDGER", data.ledgers],
        ["PRICE_LIST", data.priceLists],
        ["MAN_RECEIPT", data.manReceipts],
      ] as const) {
        await tx.counter.upsert({
          where: { userId_kind: { userId, kind } },
          create: { userId, kind, value: highest(rows) },
          update: { value: highest(rows) },
        })
      }

      return {
        clients: (data.clients ?? []).length,
        products: (data.products ?? []).length,
        receipts: (data.receipts ?? []).length,
        ledgers: (data.ledgers ?? []).length,
        priceLists: (data.priceLists ?? []).length,
        manReceipts: (data.manReceipts ?? []).length,
        // Stored, not supplied: the old storage could hold the same name
        // twice, and the user needs the number that actually landed.
        catalog: catalogStored,
      }
    },
    // A few hundred documents insert row by row; the default 5s ceiling is not
    // enough for a real backup.
    { timeout: 120_000, maxWait: 15_000 }
  )

  revalidatePath("/", "layout")
  return { summary }
}
