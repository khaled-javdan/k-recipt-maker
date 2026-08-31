"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@workspace/db"
import { hashPassword, normalizeUsername } from "@workspace/db/password"

import { requireAdmin } from "@/lib/dal"
import { createUserSchema, resetPasswordSchema } from "@/lib/schemas"

// There is no signup. Accounts exist because an admin made them, which is why
// every action here goes through requireAdmin() rather than requireUser().

export async function createUser(formData: FormData) {
  await requireAdmin()

  const parsed = createUserSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
    role: formData.get("role") ?? "USER",
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "خطا" }

  const username = normalizeUsername(parsed.data.username)
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) return { error: "این نام کاربری قبلاً استفاده شده است" }

  const user = await prisma.user.create({
    data: {
      username,
      displayName: parsed.data.displayName,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
    },
  })

  // Every user needs a settings row; creating it now avoids a null check on
  // every page that prints.
  await prisma.settings.create({ data: { userId: user.id } })

  revalidatePath("/settings/users")
  return {}
}

export async function resetUserPassword(formData: FormData) {
  await requireAdmin()

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "خطا" }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  })

  // A password reset ends every existing session for that account, which is
  // the point of resetting it.
  await prisma.session.deleteMany({ where: { userId: parsed.data.userId } })

  revalidatePath("/settings/users")
  return {}
}

export async function setUserActive(userId: string, isActive: boolean) {
  const admin = await requireAdmin()
  // Locking yourself out would leave nobody able to unlock the account.
  if (userId === admin.id) return { error: "نمی‌توانید حساب خودتان را غیرفعال کنید" }

  await prisma.user.update({ where: { id: userId }, data: { isActive } })
  if (!isActive) await prisma.session.deleteMany({ where: { userId } })

  revalidatePath("/settings/users")
  return {}
}

export async function revokeUserSessions(userId: string) {
  await requireAdmin()
  await prisma.session.deleteMany({ where: { userId } })
  revalidatePath("/settings/users")
  return {}
}

export async function listUsers() {
  await requireAdmin()
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { sessions: true } },
    },
  })
  return users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role as "ADMIN" | "USER",
    isActive: u.isActive,
    sessionCount: u._count.sessions,
  }))
}
