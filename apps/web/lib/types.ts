// Domain types. These are what the whole app works in: plain numbers, plain
// strings, arrays in display order. Prisma rows are mapped into these at the
// data-access boundary so nothing above it handles a Decimal.

export type ReceiptColumns = {
  sign: boolean
  count: boolean
  unitWeight: boolean
  totalWeight: boolean
}

export type LedgerColumns = {
  invoice: boolean
  commission: boolean
  cash: boolean
  balance: boolean
  date: boolean
}

export type PriceListConfig = {
  itemsPerColumn: number
  maxColumns: number
}

export const DEFAULT_RECEIPT_COLUMNS: ReceiptColumns = {
  sign: true,
  count: true,
  unitWeight: true,
  totalWeight: true,
}

export const DEFAULT_LEDGER_COLUMNS: LedgerColumns = {
  invoice: true,
  commission: true,
  cash: true,
  balance: true,
  date: true,
}

export const DEFAULT_PRICE_LIST_CONFIG: PriceListConfig = {
  itemsPerColumn: 30,
  maxColumns: 3,
}

export type Settings = {
  companyName: string
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  receiptColumns: ReceiptColumns
  ledgerColumns: LedgerColumns
  priceListConfig: PriceListConfig
}

export type Client = {
  id: string
  name: string
  phone: string | null
  address: string | null
}

export type Product = {
  id: string
  name: string
  colorName: string
  colorHex: string
  unitWeight: number
}

// ─── فیش — product receipt, no money on it ─────────────────────────────────

export type ReceiptItem = {
  id: string
  productId: string | null
  productName: string
  colorName: string
  colorHex: string
  unitWeight: number
  quantity: number
  weight: number
}

export type Receipt = {
  id: string
  number: number
  clientId: string | null
  clientName: string | null
  date: string
  notes: string | null
  items: ReceiptItem[]
  createdAt: string
}

// ─── حساب — account sheet ──────────────────────────────────────────────────

export type LedgerRow = {
  id: string
  name: string
  date: string | null
  invoice: number
  commission: number
  cash: number
}

export type Ledger = {
  id: string
  number: number
  title: string
  date: string
  notes: string | null
  rows: LedgerRow[]
  createdAt: string
}

// ─── Deduction sheets — فیش مزاد and فیش من share this shape ───────────────

export type ExpenseItem = {
  id: string
  label: string
  amount: number
}

export type PriceListItem = {
  id: string
  name: string
  price: number
}

export type PriceList = {
  id: string
  number: number
  title: string
  date: string
  basketCount: number | null
  commission: number | null
  commissionIsPercent: boolean
  notes: string | null
  items: PriceListItem[]
  expenses: ExpenseItem[]
  createdAt: string
}

export type ManReceiptItem = {
  id: string
  name: string
  weight: number
  /** Stored per من (4 kg), which is how the market quotes it. */
  pricePerMan: number
}

export type ManReceipt = {
  id: string
  number: number
  title: string
  date: string
  basketCount: number | null
  commission: number | null
  commissionIsPercent: boolean
  notes: string | null
  items: ManReceiptItem[]
  expenses: ExpenseItem[]
  createdAt: string
}

export type CatalogKind = "PRICE" | "MAN"

export type CatalogItem = {
  id: string
  kind: CatalogKind
  name: string
  price: number
}

/** Summary row for the list pages — avoids loading every line item. */
export type DocumentSummary = {
  id: string
  number: number
  title: string
  date: string
  itemCount: number
  total: number | null
}
