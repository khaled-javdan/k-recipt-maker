import "server-only"

import { notFound } from "next/navigation"
import { prisma, type Prisma } from "@workspace/db"
import { toNumber, toOptionalNumber } from "@workspace/db/mappers"

import { addDays, daysBetween, type DateRange, type DayTotal } from "./analytics"
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

// ─── حق earnings ───────────────────────────────────────────────────────────
// حق is summed straight out of the stored commissionAmount, the figure written
// at save time. That is the whole reason the column exists: the alternative is
// loading every line item of every sheet in the range just to re-derive a
// percentage the sheet already printed.
//
// فیش مزاد and فیش من are separate tables carrying the same earnings columns,
// so the shaping is written once and `kind` only picks the table. Each query
// branches at the delegate — the two Prisma delegates are unrelated types —
// and everything past that point is a plain row shape.

/** Which sheet type the earnings are read from. Same kinds as the catalog. */
export type EarningsKind = "PRICE" | "MAN"

export type SheetEarnings = {
  total: number
  sheetCount: number
  /** Per sheet, not per day — a day with three sheets should not read as one. */
  average: number
  byDay: DayTotal[]
  /** Same-length window immediately before the range, or null for "all time". */
  previousTotal: number | null
}

export async function getSheetEarnings(
  kind: EarningsKind,
  range: DateRange
): Promise<SheetEarnings> {
  const user = await requireUser()
  const where = rangeWhere(user.id, range)

  const [totals, byDay, previousTotal] = await Promise.all([
    sumCommission(kind, where),
    commissionByDay(kind, where),
    previousWindowTotal(kind, user.id, range),
  ])

  return {
    total: totals.total,
    sheetCount: totals.sheetCount,
    average: totals.sheetCount > 0 ? totals.total / totals.sheetCount : 0,
    byDay,
    previousTotal,
  }
}

// One row per sheet behind the total: who it was for, when, and how much حق it
// carried. This answers "where did that number come from", so it is deliberately
// per-sheet rather than grouped — a client who appears three times in a month
// should read as three sheets on three dates, not one lump.
export type EarningRow = {
  id: string
  number: number
  title: string
  date: string
  commission: number
}

/** Newest first, and capped: a wide window can hold more rows than anyone reads. */
export const EARNINGS_ROW_LIMIT = 200

export async function listEarningRows(
  kind: EarningsKind,
  range: DateRange
): Promise<EarningRow[]> {
  const user = await requireUser()

  const where = rangeWhere(user.id, range)
  const select = {
    id: true,
    number: true,
    title: true,
    date: true,
    commissionAmount: true,
  }
  const orderBy = [{ date: "desc" as const }, { number: "desc" as const }]

  return kind === "MAN"
    ? (
        await prisma.manReceipt.findMany({
          where,
          select,
          orderBy,
          take: EARNINGS_ROW_LIMIT,
        })
      ).map(toEarningRow)
    : (
        await prisma.priceList.findMany({
          where,
          select,
          orderBy,
          take: EARNINGS_ROW_LIMIT,
        })
      ).map(toEarningRow)
}

// `date` is an ISO yyyy-mm-dd string, so a string comparison is a date
// comparison — that is exactly why the column is stored zero-padded.
function rangeWhere(userId: string, range: DateRange) {
  return {
    userId,
    date: { ...(range.from ? { gte: range.from } : {}), lte: range.to },
  }
}

type CommissionWhere = ReturnType<typeof rangeWhere>

// Prisma derives each result shape from the literal it is handed, so the two
// branches of these three queries spell their arguments out rather than sharing
// one args object — which would widen the shape and lose `_sum.commissionAmount`.
async function sumCommission(
  kind: EarningsKind,
  where: CommissionWhere
): Promise<{ total: number; sheetCount: number }> {
  const result =
    kind === "MAN"
      ? await prisma.manReceipt.aggregate({
          where,
          _sum: { commissionAmount: true },
          _count: true,
        })
      : await prisma.priceList.aggregate({
          where,
          _sum: { commissionAmount: true },
          _count: true,
        })

  return { total: toNumber(result._sum.commissionAmount), sheetCount: result._count }
}

async function commissionByDay(
  kind: EarningsKind,
  where: CommissionWhere
): Promise<DayTotal[]> {
  return kind === "MAN"
    ? (
        await prisma.manReceipt.groupBy({
          by: ["date"],
          where,
          _sum: { commissionAmount: true },
          _count: true,
          orderBy: { date: "asc" },
        })
      ).map(toDayTotal)
    : (
        await prisma.priceList.groupBy({
          by: ["date"],
          where,
          _sum: { commissionAmount: true },
          _count: true,
          orderBy: { date: "asc" },
        })
      ).map(toDayTotal)
}

// "Last 30 days" is only meaningful next to the 30 before it. All-time has no
// preceding window, so it gets no comparison rather than a misleading zero.
async function previousWindowTotal(
  kind: EarningsKind,
  userId: string,
  range: DateRange
): Promise<number | null> {
  if (!range.from) return null

  const length = daysBetween(range.from, range.to) + 1
  const priorEnd = addDays(range.from, -1)
  const priorStart = addDays(priorEnd, -(length - 1))

  const { total } = await sumCommission(kind, {
    userId,
    date: { gte: priorStart, lte: priorEnd },
  })
  return total
}

type CommissionSum = { commissionAmount: Prisma.Decimal | null }

function toDayTotal(row: { date: string; _sum: CommissionSum; _count: number }): DayTotal {
  return {
    date: row.date,
    amount: toNumber(row._sum.commissionAmount),
    sheets: row._count,
  }
}

function toEarningRow(row: {
  id: string
  number: number
  title: string
  date: string
  commissionAmount: Prisma.Decimal
}): EarningRow {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    date: row.date,
    commission: toNumber(row.commissionAmount),
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
