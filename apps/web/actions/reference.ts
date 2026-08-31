"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@workspace/db"

import { requireUser } from "@/lib/dal"
import { catalogKey, normalizeName } from "@/lib/catalog-key"
import { clientSchema, productSchema } from "@/lib/schemas"
import type { CatalogKind } from "@/lib/types"

// ─── Clients ───────────────────────────────────────────────────────────────

export async function saveClient(id: string | null, formData: FormData) {
  const user = await requireUser()
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "خطا" }

  const data = {
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
  }

  if (id) {
    // updateMany, not update: the where clause carries userId, so someone
    // else's id simply matches nothing instead of updating their row.
    await prisma.client.updateMany({ where: { id, userId: user.id }, data })
  } else {
    await prisma.client.create({ data: { ...data, userId: user.id } })
  }

  revalidatePath("/clients")
  return {}
}

export async function deleteClient(id: string) {
  const user = await requireUser()
  await prisma.client.deleteMany({ where: { id, userId: user.id } })
  revalidatePath("/clients")
}

// ─── Products ──────────────────────────────────────────────────────────────

export async function saveProduct(id: string | null, formData: FormData) {
  const user = await requireUser()
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    colorName: formData.get("colorName"),
    colorHex: formData.get("colorHex"),
    unitWeight: formData.get("unitWeight"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "خطا" }

  if (id) {
    await prisma.product.updateMany({
      where: { id, userId: user.id },
      data: parsed.data,
    })
  } else {
    await prisma.product.create({ data: { ...parsed.data, userId: user.id } })
  }

  revalidatePath("/products")
  return {}
}

export async function deleteProduct(id: string) {
  const user = await requireUser()
  await prisma.product.deleteMany({ where: { id, userId: user.id } })
  revalidatePath("/products")
}

// ─── Catalogs ──────────────────────────────────────────────────────────────

export async function saveCatalogItem(
  kind: CatalogKind,
  id: string | null,
  name: string,
  price: number
) {
  const user = await requireUser()
  const clean = normalizeName(name)
  if (!clean) return { error: "نام الزامی است" }

  if (id) {
    await prisma.catalogItem.updateMany({
      where: { id, userId: user.id, kind },
      data: { name: clean, nameKey: catalogKey(clean), price },
    })
  } else {
    await prisma.catalogItem.upsert({
      where: {
        userId_kind_nameKey: { userId: user.id, kind, nameKey: catalogKey(clean) },
      },
      create: { userId: user.id, kind, name: clean, nameKey: catalogKey(clean), price },
      update: { name: clean, price },
    })
  }

  revalidatePath(kind === "PRICE" ? "/pricelists/catalog" : "/manreceipts/catalog")
  return {}
}

export async function deleteCatalogItem(kind: CatalogKind, id: string) {
  const user = await requireUser()
  await prisma.catalogItem.deleteMany({ where: { id, userId: user.id, kind } })
  revalidatePath(kind === "PRICE" ? "/pricelists/catalog" : "/manreceipts/catalog")
}
