import { z } from "zod"

// The shape written by the old app's backup button (its src/lib/backup.ts).
// Everything is permissive on the way in: this is data from a browser that has
// been running for months, so a missing key must not sink the whole import.

const num = z.coerce.number().catch(0)
const str = z.coerce.string().catch("")
const isoDate = z
  .string()
  .catch("")
  .transform((v) => (/^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : ""))

const legacyExpense = z.object({
  id: str.optional(),
  label: str,
  amount: num,
})

const deductionDoc = z.object({
  id: str.optional(),
  number: num,
  title: str,
  date: isoDate,
  basketCount: num.optional().nullable(),
  commission: num.optional().nullable(),
  commissionIsPercent: z.boolean().catch(false).optional(),
  // Superseded by expenseItems; folded into a single line on import.
  expenses: num.optional().nullable(),
  expenseItems: z.array(legacyExpense).catch([]).optional(),
  notes: str.optional().nullable(),
  createdAt: num.optional(),
})

export const backupSchema = z.object({
  app: z.literal("receipt-maker"),
  version: z.number(),
  exportedAt: z.string().optional(),
  data: z.object({
    company: z
      .object({
        name: str.optional(),
        logo: str.optional().nullable(),
        primaryColor: str.optional(),
        accentColor: str.optional(),
        receiptColumns: z.record(z.string(), z.boolean()).optional().nullable(),
        ledgerColumns: z.record(z.string(), z.boolean()).optional().nullable(),
        priceListConfig: z
          .object({ itemsPerColumn: num, maxColumns: num })
          .partial()
          .optional()
          .nullable(),
      })
      .nullable()
      .optional(),

    clients: z
      .array(
        z.object({
          id: str.optional(),
          name: str,
          phone: str.optional().nullable(),
          address: str.optional().nullable(),
        })
      )
      .catch([])
      .nullable(),

    products: z
      .array(
        z.object({
          id: str.optional(),
          name: str,
          colorName: str.optional(),
          colorHex: str.optional(),
          unitWeight: num,
        })
      )
      .catch([])
      .nullable(),

    receipts: z
      .array(
        z.object({
          id: str.optional(),
          number: num,
          clientId: str.optional().nullable(),
          clientName: str.optional().nullable(),
          date: isoDate,
          notes: str.optional().nullable(),
          createdAt: num.optional(),
          items: z
            .array(
              z.object({
                id: str.optional(),
                productId: str.optional().nullable(),
                productName: str,
                colorName: str.optional(),
                colorHex: str.optional(),
                unitWeight: num,
                quantity: num,
                weight: num,
              })
            )
            .catch([]),
        })
      )
      .catch([])
      .nullable(),

    ledgers: z
      .array(
        z.object({
          id: str.optional(),
          number: num,
          title: str,
          date: isoDate,
          notes: str.optional().nullable(),
          createdAt: num.optional(),
          rows: z
            .array(
              z.object({
                id: str.optional(),
                name: str,
                date: str.optional().nullable(),
                invoice: num,
                commission: num,
                cash: num,
              })
            )
            .catch([]),
        })
      )
      .catch([])
      .nullable(),

    priceLists: z
      .array(deductionDoc.extend({ items: z.array(z.object({ name: str, price: num })).catch([]) }))
      .catch([])
      .nullable(),

    manReceipts: z
      .array(
        deductionDoc.extend({
          items: z
            .array(z.object({ name: str, weight: num, pricePerMan: num }))
            .catch([]),
        })
      )
      .catch([])
      .nullable(),

    priceCatalog: z
      .array(z.object({ name: str, price: num }))
      .catch([])
      .nullable(),

    manCatalog: z
      .array(z.object({ name: str, price: num }))
      .catch([])
      .nullable(),

    counters: z
      .object({
        receipt: num.optional().nullable(),
        ledger: num.optional().nullable(),
        priceList: num.optional().nullable(),
        manReceipt: num.optional().nullable(),
      })
      .partial()
      .optional()
      .nullable(),
  }),
})

export type Backup = z.infer<typeof backupSchema>
