import type { Prisma } from "@workspace/db"

import { deductionTotals, manLineAmount } from "./calc"
import { catalogKey, normalizeName } from "./catalog-key"
import type { Backup } from "./import-schema"

// The one-time migration from the old localStorage app, with no Next.js or
// request context around it: the same code runs behind the admin import screen
// and behind the CLI that loads a file sent in from the owner's device. Two
// copies of this would drift, and a drift here means money printed on a sheet
// no longer matching what the database says.

export type ImportSummary = Record<string, number>

type BackupData = Backup["data"]

export type ImportOptions = {
  /** Resolved Blob URL for the logo, uploaded before the transaction opens. */
  logoUrl?: string | null
}

function toDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

// The schema reduces an unparseable date to "". That stores fine but drops the
// document out of every `userId, date` range query the earnings panel runs, so
// it has to become a real day: when the sheet happened to be typed in is a
// better guess than nothing.
function resolveDate(date: string, createdAt?: number): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  if (createdAt) return toDay(createdAt)
  return toDay(Date.now())
}

// The old app had a single `expenses` amount before it grew itemised lines.
// Anything still on the old shape becomes one line so the total stays identical.
function foldExpenses(doc: {
  expenseItems?: { label: string; amount: number }[]
  expenses?: number | null
}) {
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

// `@@unique([userId, number])` would otherwise abort the transaction partway
// through with a raw Prisma error naming neither the document nor the number.
// A backup that has been running for months is exactly where a duplicate shows
// up, so it is worth naming precisely before anything is written.
export function findNumberCollisions(data: BackupData): string[] {
  const groups: [string, { number: number }[] | null | undefined][] = [
    ["فیش", data.receipts],
    ["حساب", data.ledgers],
    ["فیش مزاد", data.priceLists],
    ["فیش من", data.manReceipts],
  ]

  const problems: string[] = []
  for (const [label, rows] of groups) {
    const counts = new Map<number, number>()
    for (const row of rows ?? []) {
      const n = Math.round(row.number)
      counts.set(n, (counts.get(n) ?? 0) + 1)
    }
    const duplicates = [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([n]) => n)
      .sort((a, b) => a - b)
    if (duplicates.length) {
      problems.push(`${label}: ${duplicates.join("، ")}`)
    }
  }
  return problems
}

export async function runImport(
  tx: Prisma.TransactionClient,
  userId: string,
  data: BackupData,
  opts: ImportOptions = {}
): Promise<ImportSummary> {
  const at = (ms?: number) => (ms ? new Date(ms) : new Date())

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
    // A logo that failed to upload leaves the existing one alone rather than
    // blanking it, so a retry without a Blob token is not destructive.
    const settings = {
      companyName: company.name ?? "",
      primaryColor: company.primaryColor || "#1f2937",
      accentColor: company.accentColor || "#7c3aed",
      ...(company.receiptColumns ? { receiptColumns: company.receiptColumns } : {}),
      ...(company.ledgerColumns ? { ledgerColumns: company.ledgerColumns } : {}),
      ...(company.priceListConfig ? { priceListConfig: company.priceListConfig } : {}),
      ...(opts.logoUrl !== undefined ? { logoUrl: opts.logoUrl } : {}),
    }
    await tx.settings.upsert({
      where: { userId },
      create: { userId, ...settings },
      update: settings,
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

  // Inserted in one statement rather than one per row: a real backup carries
  // hundreds of these, and a round trip each is what pushes the transaction
  // past its timeout.
  if (data.products?.length) {
    await tx.product.createMany({
      data: data.products.map((product) => ({
        userId,
        name: product.name,
        colorName: product.colorName ?? "",
        colorHex: /^#[0-9a-fA-F]{6}$/.test(product.colorHex ?? "")
          ? product.colorHex!
          : "#9ca3af",
        unitWeight: product.unitWeight,
      })),
    })
  }

  for (const receipt of data.receipts ?? []) {
    await tx.receipt.create({
      data: {
        userId,
        number: Math.round(receipt.number),
        clientId: receipt.clientId ? (clientIdMap.get(receipt.clientId) ?? null) : null,
        clientName: receipt.clientName || null,
        date: resolveDate(receipt.date, receipt.createdAt),
        notes: receipt.notes || null,
        createdAt: at(receipt.createdAt),
        items: {
          create: receipt.items.map((item, position) => ({
            position,
            // Product details are denormalised onto the line, so the printed
            // sheet is complete without the pointer back to the Product row.
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
        date: resolveDate(ledger.date, ledger.createdAt),
        notes: ledger.notes || null,
        createdAt: at(ledger.createdAt),
        rows: {
          create: ledger.rows.map((row, position) => ({
            position,
            name: row.name,
            // A row date is genuinely optional on this document, so an
            // unparseable one stays null rather than being invented.
            date: /^\d{4}-\d{2}-\d{2}/.test(row.date ?? "") ? row.date!.slice(0, 10) : null,
            invoice: row.invoice,
            commission: row.commission,
            cash: row.cash,
          })),
        },
      },
    })
  }

  for (const priceList of data.priceLists ?? []) {
    const items = priceList.items.map((item, position) => ({
      position,
      name: item.name,
      price: item.price,
    }))
    const expenses = foldExpenses(priceList)

    // The stored حق must equal what the sheet prints. Resolved through the
    // sheet's own calculation — the same call savePriceList() makes — rather
    // than left at the column default, which would report zero earnings for
    // every imported sheet.
    const { commission: commissionAmount } = deductionTotals({
      lineAmounts: items.map((i) => i.price),
      commission: priceList.commission ?? undefined,
      commissionIsPercent: priceList.commissionIsPercent,
      expenses,
    })

    await tx.priceList.create({
      data: {
        userId,
        number: Math.round(priceList.number),
        title: priceList.title,
        date: resolveDate(priceList.date, priceList.createdAt),
        basketCount: priceList.basketCount ? Math.round(priceList.basketCount) : null,
        commission: priceList.commission ?? null,
        commissionIsPercent: priceList.commissionIsPercent ?? false,
        commissionAmount,
        notes: priceList.notes || null,
        createdAt: at(priceList.createdAt),
        items: { create: items },
        expenses: { create: expenses },
      },
    })
  }

  for (const manReceipt of data.manReceipts ?? []) {
    const items = manReceipt.items.map((item, position) => ({
      position,
      name: item.name,
      weight: item.weight,
      pricePerMan: item.pricePerMan,
    }))
    const expenses = foldExpenses(manReceipt)

    // Same contract as the auction sheet, with the line amounts derived from
    // weight and the per-من rate first.
    const { commission: commissionAmount } = deductionTotals({
      lineAmounts: items.map(manLineAmount),
      commission: manReceipt.commission ?? undefined,
      commissionIsPercent: manReceipt.commissionIsPercent,
      expenses,
    })

    await tx.manReceipt.create({
      data: {
        userId,
        number: Math.round(manReceipt.number),
        title: manReceipt.title,
        date: resolveDate(manReceipt.date, manReceipt.createdAt),
        basketCount: manReceipt.basketCount ? Math.round(manReceipt.basketCount) : null,
        commission: manReceipt.commission ?? null,
        commissionIsPercent: manReceipt.commissionIsPercent ?? false,
        commissionAmount,
        notes: manReceipt.notes || null,
        createdAt: at(manReceipt.createdAt),
        items: { create: items },
        expenses: { create: expenses },
      },
    })
  }

  // Two catalogs, one table. De-duplicated on the way in because the old
  // storage had no unique index and could hold the same name twice.
  const catalogRows: {
    userId: string
    kind: "PRICE" | "MAN"
    nameKey: string
    name: string
    price: number
  }[] = []
  for (const [kind, entries] of [
    ["PRICE", data.priceCatalog ?? []],
    ["MAN", data.manCatalog ?? []],
  ] as const) {
    const seen = new Map<string, { name: string; price: number }>()
    for (const entry of entries) {
      const name = normalizeName(entry.name)
      if (!name) continue
      // Later rows win, so a name carried by two devices keeps the price from
      // whichever backup was appended last.
      seen.set(catalogKey(name), { name, price: entry.price })
    }
    for (const [nameKey, value] of seen) {
      catalogRows.push({ userId, kind, nameKey, name: value.name, price: value.price })
    }
  }
  // One statement for what can be a thousand rows.
  if (catalogRows.length) await tx.catalogItem.createMany({ data: catalogRows })
  const catalogStored = catalogRows.length

  // Numbering continues from the old app's own counter, not just the highest
  // surviving document: a user who deleted their most recent sheets would
  // otherwise be handed a number that is already on a sheet in someone's hand.
  const counters = data.counters ?? {}
  const resume = (stored: number | null | undefined, rows: { number: number }[] | null | undefined) =>
    Math.max(1000, Math.round(stored ?? 0), ...(rows ?? []).map((r) => Math.round(r.number)))

  for (const [kind, stored, rows] of [
    ["RECEIPT", counters.receipt, data.receipts],
    ["LEDGER", counters.ledger, data.ledgers],
    ["PRICE_LIST", counters.priceList, data.priceLists],
    ["MAN_RECEIPT", counters.manReceipt, data.manReceipts],
  ] as const) {
    const value = resume(stored, rows)
    await tx.counter.upsert({
      where: { userId_kind: { userId, kind } },
      create: { userId, kind, value },
      update: { value },
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
}
