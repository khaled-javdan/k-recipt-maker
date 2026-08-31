import "server-only"

import { notFound } from "next/navigation"
import { prisma } from "@workspace/db"
import { toNumber, toOptionalNumber } from "@workspace/db/mappers"

import { requireUser } from "./dal"
import {
  DEFAULT_LEDGER_COLUMNS,
  DEFAULT_PRICE_LIST_CONFIG,
  DEFAULT_RECEIPT_COLUMNS,
  type CatalogKind,
  type Client,
  type Ledger,
  type ManReceipt,
  type PriceList,
  type Product,
  type Receipt,
  type Settings,
} from "./types"

// Every read starts with requireUser() and filters on that user's id. A row
// that belongs to someone else must be indistinguishable from one that does
// not exist, so lookups by id return notFound() rather than a 403.

const byPosition = { orderBy: { position: "asc" } } as const

// ─── Settings ──────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  const user = await requireUser()
  const row = await prisma.settings.findUnique({ where: { userId: user.id } })

  return {
    companyName: row?.companyName ?? "",
    logoUrl: row?.logoUrl ?? null,
    primaryColor: row?.primaryColor ?? "#1f2937",
    accentColor: row?.accentColor ?? "#7c3aed",
    // The JSON columns are presentation config; fall back rather than trusting
    // whatever shape happens to be stored.
    receiptColumns: { ...DEFAULT_RECEIPT_COLUMNS, ...(row?.receiptColumns as object) },
    ledgerColumns: { ...DEFAULT_LEDGER_COLUMNS, ...(row?.ledgerColumns as object) },
    priceListConfig: {
      ...DEFAULT_PRICE_LIST_CONFIG,
      ...(row?.priceListConfig as object),
    },
  }
}

// ─── Reference data ────────────────────────────────────────────────────────

export async function listClients(): Promise<Client[]> {
  const user = await requireUser()
  const rows = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    address: c.address,
  }))
}

export async function listProducts(): Promise<Product[]> {
  const user = await requireUser()
  const rows = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    colorName: p.colorName,
    colorHex: p.colorHex,
    unitWeight: toNumber(p.unitWeight),
  }))
}

export async function listCatalog(kind: CatalogKind) {
  const user = await requireUser()
  const rows = await prisma.catalogItem.findMany({
    where: { userId: user.id, kind },
    orderBy: { createdAt: "desc" },
  })
  return rows.map((c) => ({
    id: c.id,
    kind: c.kind as CatalogKind,
    name: c.name,
    price: toNumber(c.price),
  }))
}

// ─── فیش ───────────────────────────────────────────────────────────────────

export async function listReceipts(): Promise<Receipt[]> {
  const user = await requireUser()
  const rows = await prisma.receipt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: byPosition },
  })
  return rows.map(mapReceipt)
}

export async function getReceipt(id: string): Promise<Receipt> {
  const user = await requireUser()
  const row = await prisma.receipt.findFirst({
    where: { id, userId: user.id },
    include: { items: byPosition },
  })
  if (!row) notFound()
  return mapReceipt(row)
}

type ReceiptRow = Awaited<ReturnType<typeof listReceiptRows>>[number]
function listReceiptRows() {
  return prisma.receipt.findMany({ include: { items: byPosition } })
}

function mapReceipt(r: ReceiptRow): Receipt {
  return {
    id: r.id,
    number: r.number,
    clientId: r.clientId,
    clientName: r.clientName,
    date: r.date,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    items: r.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      colorName: i.colorName,
      colorHex: i.colorHex,
      unitWeight: toNumber(i.unitWeight),
      quantity: i.quantity,
      weight: toNumber(i.weight),
    })),
  }
}

// ─── حساب ──────────────────────────────────────────────────────────────────

export async function listLedgers(): Promise<Ledger[]> {
  const user = await requireUser()
  const rows = await prisma.ledger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { rows: byPosition },
  })
  return rows.map(mapLedger)
}

export async function getLedger(id: string): Promise<Ledger> {
  const user = await requireUser()
  const row = await prisma.ledger.findFirst({
    where: { id, userId: user.id },
    include: { rows: byPosition },
  })
  if (!row) notFound()
  return mapLedger(row)
}

type LedgerRowSet = Awaited<ReturnType<typeof listLedgerRows>>[number]
function listLedgerRows() {
  return prisma.ledger.findMany({ include: { rows: byPosition } })
}

function mapLedger(l: LedgerRowSet): Ledger {
  return {
    id: l.id,
    number: l.number,
    title: l.title,
    date: l.date,
    notes: l.notes,
    createdAt: l.createdAt.toISOString(),
    rows: l.rows.map((r) => ({
      id: r.id,
      name: r.name,
      date: r.date,
      invoice: toNumber(r.invoice),
      commission: toNumber(r.commission),
      cash: toNumber(r.cash),
    })),
  }
}

// ─── فیش مزاد ──────────────────────────────────────────────────────────────

export async function listPriceLists(): Promise<PriceList[]> {
  const user = await requireUser()
  const rows = await prisma.priceList.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: byPosition, expenses: byPosition },
  })
  return rows.map(mapPriceList)
}

export async function getPriceList(id: string): Promise<PriceList> {
  const user = await requireUser()
  const row = await prisma.priceList.findFirst({
    where: { id, userId: user.id },
    include: { items: byPosition, expenses: byPosition },
  })
  if (!row) notFound()
  return mapPriceList(row)
}

type PriceListRow = Awaited<ReturnType<typeof listPriceListRows>>[number]
function listPriceListRows() {
  return prisma.priceList.findMany({
    include: { items: byPosition, expenses: byPosition },
  })
}

function mapPriceList(p: PriceListRow): PriceList {
  return {
    id: p.id,
    number: p.number,
    title: p.title,
    date: p.date,
    basketCount: p.basketCount,
    commission: toOptionalNumber(p.commission) ?? null,
    commissionIsPercent: p.commissionIsPercent,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    items: p.items.map((i) => ({ id: i.id, name: i.name, price: toNumber(i.price) })),
    expenses: p.expenses.map((e) => ({
      id: e.id,
      label: e.label,
      amount: toNumber(e.amount),
    })),
  }
}

// ─── فیش من ────────────────────────────────────────────────────────────────

export async function listManReceipts(): Promise<ManReceipt[]> {
  const user = await requireUser()
  const rows = await prisma.manReceipt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: byPosition, expenses: byPosition },
  })
  return rows.map(mapManReceipt)
}

export async function getManReceipt(id: string): Promise<ManReceipt> {
  const user = await requireUser()
  const row = await prisma.manReceipt.findFirst({
    where: { id, userId: user.id },
    include: { items: byPosition, expenses: byPosition },
  })
  if (!row) notFound()
  return mapManReceipt(row)
}

type ManReceiptRow = Awaited<ReturnType<typeof listManReceiptRows>>[number]
function listManReceiptRows() {
  return prisma.manReceipt.findMany({
    include: { items: byPosition, expenses: byPosition },
  })
}

function mapManReceipt(m: ManReceiptRow): ManReceipt {
  return {
    id: m.id,
    number: m.number,
    title: m.title,
    date: m.date,
    basketCount: m.basketCount,
    commission: toOptionalNumber(m.commission) ?? null,
    commissionIsPercent: m.commissionIsPercent,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    items: m.items.map((i) => ({
      id: i.id,
      name: i.name,
      weight: toNumber(i.weight),
      pricePerMan: toNumber(i.pricePerMan),
    })),
    expenses: m.expenses.map((e) => ({
      id: e.id,
      label: e.label,
      amount: toNumber(e.amount),
    })),
  }
}
