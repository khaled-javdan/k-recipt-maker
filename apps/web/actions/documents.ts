"use server"

import { revalidatePath } from "next/cache"
import { prisma, type CatalogKind, type Prisma } from "@workspace/db"

import { deductionTotals, manLineAmount } from "@/lib/calc"
import { catalogKey, normalizeName } from "@/lib/catalog-key"
import { nextNumber } from "@/lib/counter"
import { requireUser } from "@/lib/dal"
import {
  ledgerSchema,
  manReceiptSchema,
  priceListSchema,
  receiptSchema,
  type LedgerInput,
  type ManReceiptInput,
  type PriceListInput,
  type ReceiptInput,
} from "@/lib/schemas"

export type SaveResult = { id?: string; error?: string }

// Rows arrive as a full replacement of the document's children: the editors let
// the user insert, reorder and delete freely, so diffing them would be more
// code and more ways to be wrong than deleting and re-inserting inside the
// same transaction.

// A price of 0 usually means an empty row the user tabbed past, not a genuine
// free item, so blank lines are dropped rather than printed.
const hasContent = (name: string) => normalizeName(name).length > 0

// ─── فیش ───────────────────────────────────────────────────────────────────

export async function saveReceipt(
  id: string | null,
  input: ReceiptInput
): Promise<SaveResult> {
  const user = await requireUser()
  const parsed = receiptSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "خطا" }
  const data = parsed.data

  const items = data.items
    .filter((i) => hasContent(i.productName))
    .map((i, position) => ({
      position,
      productId: i.productId ?? null,
      productName: normalizeName(i.productName),
      colorName: i.colorName,
      colorHex: i.colorHex,
      unitWeight: i.unitWeight,
      quantity: Math.round(i.quantity),
      weight: i.weight,
    }))

  const header = {
    clientId: data.clientId ?? null,
    clientName: data.clientName ?? null,
    date: data.date,
    notes: data.notes ?? null,
  }

  const result = await prisma.$transaction(async (tx) => {
    if (id) {
      const owned = await tx.receipt.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      })
      if (!owned) return null
      await tx.receiptItem.deleteMany({ where: { receiptId: id } })
      await tx.receipt.update({
        where: { id },
        data: { ...header, items: { create: items } },
      })
      return id
    }

    const created = await tx.receipt.create({
      data: {
        ...header,
        userId: user.id,
        number: await nextNumber(tx, user.id, "RECEIPT"),
        items: { create: items },
      },
      select: { id: true },
    })
    return created.id
  })

  if (!result) return { error: "یافت نشد" }
  revalidatePath("/receipts")
  return { id: result }
}

// ─── حساب ──────────────────────────────────────────────────────────────────

export async function saveLedger(
  id: string | null,
  input: LedgerInput
): Promise<SaveResult> {
  const user = await requireUser()
  const parsed = ledgerSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "خطا" }
  const data = parsed.data

  const rows = data.rows
    .filter((r) => hasContent(r.name) || r.invoice || r.commission || r.cash)
    .map((r, position) => ({
      position,
      name: normalizeName(r.name),
      date: r.date || null,
      invoice: r.invoice,
      commission: r.commission,
      cash: r.cash,
    }))

  const header = { title: data.title, date: data.date, notes: data.notes ?? null }

  const result = await prisma.$transaction(async (tx) => {
    if (id) {
      const owned = await tx.ledger.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      })
      if (!owned) return null
      await tx.ledgerRow.deleteMany({ where: { ledgerId: id } })
      await tx.ledger.update({
        where: { id },
        data: { ...header, rows: { create: rows } },
      })
      return id
    }

    const created = await tx.ledger.create({
      data: {
        ...header,
        userId: user.id,
        number: await nextNumber(tx, user.id, "LEDGER"),
        rows: { create: rows },
      },
      select: { id: true },
    })
    return created.id
  })

  if (!result) return { error: "یافت نشد" }
  revalidatePath("/ledgers")
  return { id: result }
}

// ─── Deduction sheets ──────────────────────────────────────────────────────

// Saving a sheet teaches the matching catalog what each item last sold for, so
// the next sheet can autocomplete it. Upserted on the unique (user, kind, key).
async function learnItems(
  tx: Prisma.TransactionClient,
  userId: string,
  kind: CatalogKind,
  items: { name: string; price: number }[]
) {
  const seen = new Map<string, { name: string; price: number }>()
  for (const it of items) {
    const name = normalizeName(it.name)
    if (!name) continue
    // Later rows win, matching the old app: the catalog remembers the last
    // price on the sheet, not the first.
    seen.set(catalogKey(name), { name, price: it.price })
  }

  for (const [key, value] of seen) {
    await tx.catalogItem.upsert({
      where: { userId_kind_nameKey: { userId, kind, nameKey: key } },
      create: { userId, kind, nameKey: key, name: value.name, price: value.price },
      update: { name: value.name, price: value.price },
    })
  }
}

export async function savePriceList(
  id: string | null,
  input: PriceListInput
): Promise<SaveResult> {
  const user = await requireUser()
  const parsed = priceListSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "خطا" }
  const data = parsed.data

  const items = data.items
    .filter((i) => hasContent(i.name))
    .map((i, position) => ({ position, name: normalizeName(i.name), price: i.price }))

  const expenses = data.expenses
    .filter((e) => hasContent(e.label) || e.amount)
    .map((e, position) => ({ position, label: normalizeName(e.label), amount: e.amount }))

  // The stored حق must equal what the sheet prints, so it is resolved through
  // the same calculation the sheet uses, over the same filtered items — a
  // percentage of a subtotal that counted blank rows would not match.
  const { commission: commissionAmount } = deductionTotals({
    lineAmounts: items.map((i) => i.price),
    commission: data.commission,
    commissionIsPercent: data.commissionIsPercent,
    expenses,
  })

  const header = {
    title: data.title,
    date: data.date,
    basketCount: data.basketCount ?? null,
    commission: data.commission ?? null,
    commissionIsPercent: data.commissionIsPercent,
    commissionAmount,
    notes: data.notes ?? null,
  }

  const result = await prisma.$transaction(async (tx) => {
    let documentId = id
    if (id) {
      const owned = await tx.priceList.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      })
      if (!owned) return null
      await tx.priceListItem.deleteMany({ where: { priceListId: id } })
      await tx.priceListExpense.deleteMany({ where: { priceListId: id } })
      await tx.priceList.update({
        where: { id },
        data: { ...header, items: { create: items }, expenses: { create: expenses } },
      })
    } else {
      const created = await tx.priceList.create({
        data: {
          ...header,
          userId: user.id,
          number: await nextNumber(tx, user.id, "PRICE_LIST"),
          items: { create: items },
          expenses: { create: expenses },
        },
        select: { id: true },
      })
      documentId = created.id
    }

    await learnItems(tx, user.id, "PRICE", items)
    return documentId
  })

  if (!result) return { error: "یافت نشد" }
  revalidatePath("/pricelists")
  return { id: result }
}

export async function saveManReceipt(
  id: string | null,
  input: ManReceiptInput
): Promise<SaveResult> {
  const user = await requireUser()
  const parsed = manReceiptSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "خطا" }
  const data = parsed.data

  const items = data.items
    .filter((i) => hasContent(i.name))
    .map((i, position) => ({
      position,
      name: normalizeName(i.name),
      weight: i.weight,
      pricePerMan: i.pricePerMan,
    }))

  const expenses = data.expenses
    .filter((e) => hasContent(e.label) || e.amount)
    .map((e, position) => ({ position, label: normalizeName(e.label), amount: e.amount }))

  // Same contract as savePriceList: the stored حق is resolved through the
  // sheet's own calculation, so it equals the figure printed on it. The line
  // amounts are derived from weight and the per-من rate first.
  const { commission: commissionAmount } = deductionTotals({
    lineAmounts: items.map(manLineAmount),
    commission: data.commission,
    commissionIsPercent: data.commissionIsPercent,
    expenses,
  })

  const header = {
    title: data.title,
    date: data.date,
    basketCount: data.basketCount ?? null,
    commission: data.commission ?? null,
    commissionIsPercent: data.commissionIsPercent,
    commissionAmount,
    notes: data.notes ?? null,
  }

  const result = await prisma.$transaction(async (tx) => {
    let documentId = id
    if (id) {
      const owned = await tx.manReceipt.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      })
      if (!owned) return null
      await tx.manReceiptItem.deleteMany({ where: { manReceiptId: id } })
      await tx.manReceiptExpense.deleteMany({ where: { manReceiptId: id } })
      await tx.manReceipt.update({
        where: { id },
        data: { ...header, items: { create: items }, expenses: { create: expenses } },
      })
    } else {
      const created = await tx.manReceipt.create({
        data: {
          ...header,
          userId: user.id,
          number: await nextNumber(tx, user.id, "MAN_RECEIPT"),
          items: { create: items },
          expenses: { create: expenses },
        },
        select: { id: true },
      })
      documentId = created.id
    }

    // The من catalog stores the per-من rate, which is what the editor submits.
    await learnItems(
      tx,
      user.id,
      "MAN",
      items.map((i) => ({ name: i.name, price: i.pricePerMan }))
    )
    return documentId
  })

  if (!result) return { error: "یافت نشد" }
  revalidatePath("/manreceipts")
  return { id: result }
}

// ─── Deletion ──────────────────────────────────────────────────────────────

export async function deleteReceipt(id: string) {
  const user = await requireUser()
  await prisma.receipt.deleteMany({ where: { id, userId: user.id } })
  revalidatePath("/receipts")
}

export async function deleteLedger(id: string) {
  const user = await requireUser()
  await prisma.ledger.deleteMany({ where: { id, userId: user.id } })
  revalidatePath("/ledgers")
}

export async function deletePriceList(id: string) {
  const user = await requireUser()
  await prisma.priceList.deleteMany({ where: { id, userId: user.id } })
  revalidatePath("/pricelists")
}

export async function deleteManReceipt(id: string) {
  const user = await requireUser()
  await prisma.manReceipt.deleteMany({ where: { id, userId: user.id } })
  revalidatePath("/manreceipts")
}
