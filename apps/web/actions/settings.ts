"use server"

import { revalidatePath } from "next/cache"
import { del, put } from "@vercel/blob"
import { prisma } from "@workspace/db"

import { requireUser } from "@/lib/dal"
import { getT } from "@/lib/i18n/server"
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

// ─── Logo ──────────────────────────────────────────────────────────────────
// The logo is printed on every sheet and rasterised by html2canvas on export,
// so it lives in Vercel Blob and the row holds only the URL. A data: URI would
// be re-read on every settings load and every sheet render.

const MAX_LOGO_BYTES = 2 * 1024 * 1024

// Raster formats plus SVG. Anything else — a PDF or a HEIC the phone picker
// happily offers — would upload fine and then fail to paint on the sheet.
const LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

// Only ever delete a blob this app wrote. A logoUrl pointing anywhere else was
// not ours to remove, and del() on a foreign URL should not be attempted.
async function deleteLogoBlob(url: string | null | undefined) {
  if (!url?.includes(".public.blob.vercel-storage.com/")) return
  try {
    await del(url)
  } catch {
    // A missing or already-deleted blob must not fail the surrounding save —
    // the row is the source of truth and it has already moved on.
  }
}

export async function uploadLogo(formData: FormData) {
  const t = await getT()

  const user = await requireUser()

  const file = formData.get("logo")
  if (!(file instanceof File) || file.size === 0) {
    return { error: t.settings.logoMissing }
  }
  if (file.size > MAX_LOGO_BYTES) return { error: t.settings.logoTooLarge }

  const ext = LOGO_TYPES[file.type]
  if (!ext) return { error: t.settings.logoBadType }

  const previous = await prisma.settings.findUnique({
    where: { userId: user.id },
    select: { logoUrl: true },
  })

  // addRandomSuffix keeps a re-upload from being served from the CDN copy of
  // the file it replaced, which is what a stable pathname would do.
  const blob = await put(`logos/${user.id}.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  })

  await upsertSettings(user.id, { logoUrl: blob.url })
  await deleteLogoBlob(previous?.logoUrl)

  return { url: blob.url }
}

export async function removeLogo() {
  const user = await requireUser()

  const previous = await prisma.settings.findUnique({
    where: { userId: user.id },
    select: { logoUrl: true },
  })

  await upsertSettings(user.id, { logoUrl: null })
  await deleteLogoBlob(previous?.logoUrl)

  return {}
}
