import { z } from "zod"

// One schema per document, shared by the client form and the server action.
// Numbers arrive as strings from the editors (see the draft-string pattern in
// components/editors) so every numeric field coerces and normalises here.

import { toLatinDigits } from "./calc/digits"

/** Accepts "", "۱۲.۵", " 12.5 " — anything unparseable becomes 0. */
const numeric = z
  .union([z.string(), z.number()])
  .transform((v) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0
    const n = Number(toLatinDigits(v).trim())
    return Number.isFinite(n) ? n : 0
  })

/** Same, but blank stays undefined rather than collapsing to 0. */
const optionalNumeric = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return undefined
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined
    const trimmed = toLatinDigits(v).trim()
    if (!trimmed) return undefined
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : undefined
  })

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ نامعتبر است")

const title = z.string().trim().min(1, "الزامی").max(200)
const notes = z.string().trim().max(2000).optional().nullable()

// ─── Reference data ────────────────────────────────────────────────────────

export const clientSchema = z.object({
  name: title,
  phone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
})

export const productSchema = z.object({
  name: title,
  colorName: z.string().trim().max(60),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "رنگ نامعتبر است"),
  unitWeight: numeric,
})

// ─── فیش ───────────────────────────────────────────────────────────────────

export const receiptItemSchema = z.object({
  productId: z.string().nullable().optional(),
  productName: z.string().trim().max(200),
  colorName: z.string().trim().max(60),
  colorHex: z.string().max(9),
  unitWeight: numeric,
  quantity: numeric,
  weight: numeric,
})

export const receiptSchema = z.object({
  clientId: z.string().nullable().optional(),
  clientName: z.string().trim().max(200).nullable().optional(),
  date: isoDate,
  notes,
  items: z.array(receiptItemSchema),
})

// ─── حساب ──────────────────────────────────────────────────────────────────

export const ledgerRowSchema = z.object({
  name: z.string().trim().max(200),
  date: z.union([isoDate, z.literal("")]).nullable().optional(),
  invoice: numeric,
  commission: numeric,
  cash: numeric,
})

export const ledgerSchema = z.object({
  title,
  date: isoDate,
  notes,
  rows: z.array(ledgerRowSchema),
})

// ─── Deduction sheets ──────────────────────────────────────────────────────

export const expenseSchema = z.object({
  label: z.string().trim().max(120),
  amount: numeric,
})

const deductionFields = {
  title,
  date: isoDate,
  basketCount: optionalNumeric,
  commission: optionalNumeric,
  commissionIsPercent: z.boolean().default(false),
  notes,
  expenses: z.array(expenseSchema),
}

export const priceListSchema = z.object({
  ...deductionFields,
  items: z.array(
    z.object({
      name: z.string().trim().max(200),
      price: numeric,
    })
  ),
})

export const manReceiptSchema = z.object({
  ...deductionFields,
  items: z.array(
    z.object({
      name: z.string().trim().max(200),
      weight: numeric,
      /** Already converted to a per-من rate by the editor before submit. */
      pricePerMan: numeric,
    })
  ),
})

// ─── Settings ──────────────────────────────────────────────────────────────

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "رنگ نامعتبر است")

export const settingsSchema = z.object({
  companyName: z.string().trim().max(120),
  primaryColor: hex,
  accentColor: hex,
})

export const receiptColumnsSchema = z.object({
  sign: z.boolean(),
  count: z.boolean(),
  unitWeight: z.boolean(),
  totalWeight: z.boolean(),
})

export const ledgerColumnsSchema = z.object({
  invoice: z.boolean(),
  commission: z.boolean(),
  cash: z.boolean(),
  balance: z.boolean(),
  date: z.boolean(),
})

export const priceListConfigSchema = z.object({
  itemsPerColumn: z.coerce.number().int().min(1).max(200),
  maxColumns: z.coerce.number().int().min(1).max(6),
})

// ─── Accounts ──────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "حداقل ۳ نویسه")
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, "فقط حروف انگلیسی، عدد و . _ -"),
  displayName: z.string().trim().min(1, "الزامی").max(120),
  password: z.string().min(8, "حداقل ۸ نویسه").max(200),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
})

export const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(8, "حداقل ۸ نویسه").max(200),
})

export type ReceiptInput = z.input<typeof receiptSchema>
export type LedgerInput = z.input<typeof ledgerSchema>
export type PriceListInput = z.input<typeof priceListSchema>
export type ManReceiptInput = z.input<typeof manReceiptSchema>
