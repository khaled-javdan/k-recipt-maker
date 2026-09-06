import { z } from "zod"

// The shape written by the old app's backup button (its src/lib/backup.ts).
// Everything is permissive on the way in: this is data from a browser that has
// been running for months, so a missing key must not sink the whole import.

const num = z.coerce.number().catch(0)
const str = z.coerce.string().catch("")

// z.coerce.string() applies String() to its input before .optional() is
// consulted, so a key the old app simply never wrote arrives as the literal
// "undefined" — which then stores as a real note or a real phone number.
// Optional strings have to guard the coercion rather than rely on .optional().
const optionalStr = z
  .unknown()
  .optional()
  .transform((v) => (v == null ? null : String(v)))
const isoDate = z
  .string()
  .catch("")
  .transform((v) => (/^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : ""))

const legacyExpense = z.object({
  id: optionalStr,
  label: str,
  amount: num,
})

const deductionDoc = z.object({
  id: optionalStr,
  number: num,
  title: str,
  date: isoDate,
  basketCount: num.optional().nullable(),
  commission: num.optional().nullable(),
  commissionIsPercent: z.boolean().catch(false).optional(),
  // Superseded by expenseItems; folded into a single line on import.
  expenses: num.optional().nullable(),
  expenseItems: z.array(legacyExpense).catch([]).optional(),
  notes: optionalStr,
  createdAt: num.optional(),
})

export const backupSchema = z.object({
  app: z.literal("receipt-maker"),
  version: z.number(),
  exportedAt: z.string().optional(),
  data: z.object({
    company: z
      .object({
        name: optionalStr,
        logo: optionalStr,
        primaryColor: optionalStr,
        accentColor: optionalStr,
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
          id: optionalStr,
          name: str,
          phone: optionalStr,
          address: optionalStr,
        })
      )
      .catch([])
      .nullable(),

    products: z
      .array(
        z.object({
          id: optionalStr,
          name: str,
          colorName: optionalStr,
          colorHex: optionalStr,
          unitWeight: num,
        })
      )
      .catch([])
      .nullable(),

    receipts: z
      .array(
        z.object({
          id: optionalStr,
          number: num,
          clientId: optionalStr,
          clientName: optionalStr,
          date: isoDate,
          notes: optionalStr,
          createdAt: num.optional(),
          items: z
            .array(
              z.object({
                id: optionalStr,
                productId: optionalStr,
                productName: str,
                colorName: optionalStr,
                colorHex: optionalStr,
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
          id: optionalStr,
          number: num,
          title: str,
          date: isoDate,
          notes: optionalStr,
          createdAt: num.optional(),
          rows: z
            .array(
              z.object({
                id: optionalStr,
                name: str,
                date: optionalStr,
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
