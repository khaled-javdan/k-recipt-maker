"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@workspace/db"

import { requireAdmin } from "@/lib/dal"
import { findNumberCollisions, findWorkNewerThan, runImport } from "@/lib/import-core"
import { importLogo } from "@/lib/import-logo"
import { backupSchema } from "@/lib/import-schema"

export type ImportResult = {
  error?: string
  warning?: string
  summary?: Record<string, number>
}

// One-time migration from the old localStorage app. Everything lands in a
// single transaction: a partial import would leave the user unable to tell
// what made it across.
//
// Re-running replaces rather than duplicates, so a failed attempt can simply
// be retried.
//
// The work itself lives in lib/import-core so the CLI in scripts/import-backup.ts
// runs exactly the same code — a backup large enough to exceed the server
// action body limit has to go through the CLI, and the two paths must agree.
export async function importBackup(json: string): Promise<ImportResult> {
  const admin = await requireAdmin()

  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { error: "فایل JSON خوانده نشد" }
  }

  const parsed = backupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: `فایل معتبر نیست: ${parsed.error.issues[0]?.message ?? ""}` }
  }

  const data = parsed.data.data

  // Reported before anything is written, rather than as a unique-constraint
  // failure partway through the transaction.
  const collisions = findNumberCollisions(data)
  if (collisions.length) {
    return { error: `شماره تکراری در فایل: ${collisions.join(" — ")}` }
  }

  // This replaces everything the account owns, so anything entered into the app
  // after the backup was taken is destroyed by it. There is no --force here:
  // a screen that silently eats a morning's work is not worth the convenience.
  const exportedAt = parsed.data.exportedAt ? new Date(parsed.data.exportedAt) : null
  if (exportedAt && !Number.isNaN(exportedAt.getTime())) {
    const newer = await findWorkNewerThan(prisma, admin.id, exportedAt)
    if (newer.length) {
      const summary = newer.map((n) => `${n.count} ${n.label}`).join("، ")
      return {
        error: `این حساب سندهایی دارد که پس از تهیه فایل پشتیبان ثبت شده‌اند (${summary}). ورود اطلاعات آن‌ها را پاک می‌کند.`,
      }
    }
  }

  // Uploaded outside the transaction: a network round trip must not hold locks
  // on every table the user owns.
  const logo = await importLogo(admin.id, data.company?.logo)

  const summary = await prisma.$transaction(
    (tx) =>
      runImport(tx, admin.id, data, {
        logoUrl: logo.status === "uploaded" ? logo.url : undefined,
      }),
    // A few hundred documents insert row by row; the default 5s ceiling is not
    // enough for a real backup.
    { timeout: 120_000, maxWait: 15_000 }
  )

  revalidatePath("/", "layout")
  return {
    summary,
    ...(logo.status === "skipped" ? { warning: `لوگو منتقل نشد: ${logo.reason}` } : {}),
  }
}
