"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@workspace/db"

import { requireUser } from "@/lib/dal"
import {
  ledgerColumnsSchema,
  priceListConfigSchema,
  receiptColumnsSchema,
  settingsSchema,
} from "@/lib/schemas"

// Settings live in one row per user, created on demand — a user seeded before
// this feature existed still gets defaults on first save.
async function upsertSettings(userId: string, data: Record<string, unknown>) {
  await prisma.settings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
  revalidatePath("/settings")
  revalidatePath("/", "layout")
}

export async function saveBranding(formData: FormData) {
  const user = await requireUser()
  const parsed = settingsSchema.safeParse({
    companyName: formData.get("companyName"),
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "خطا" }

  await upsertSettings(user.id, parsed.data)
  return {}
}

export async function saveReceiptColumns(columns: unknown) {
  const user = await requireUser()
  const parsed = receiptColumnsSchema.safeParse(columns)
  if (!parsed.success) return { error: "خطا" }
  await upsertSettings(user.id, { receiptColumns: parsed.data })
  return {}
}

export async function saveLedgerColumns(columns: unknown) {
  const user = await requireUser()
  const parsed = ledgerColumnsSchema.safeParse(columns)
  if (!parsed.success) return { error: "خطا" }
  await upsertSettings(user.id, { ledgerColumns: parsed.data })
  return {}
}

export async function savePriceListConfig(config: unknown) {
  const user = await requireUser()
  const parsed = priceListConfigSchema.safeParse(config)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "خطا" }
  await upsertSettings(user.id, { priceListConfig: parsed.data })
  return {}
}

export async function saveLogoUrl(logoUrl: string | null) {
  const user = await requireUser()
  await upsertSettings(user.id, { logoUrl })
  return {}
}
