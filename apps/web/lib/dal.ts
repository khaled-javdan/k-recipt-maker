import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { prisma } from "@workspace/db"

import { getSessionId } from "./session"

// The data access layer is the real authorisation boundary. proxy.ts only does
// an optimistic cookie check to avoid a database round trip on every asset
// request — it proves nothing. Every page and every server action starts here.

export type CurrentUser = {
  id: string
  username: string
  displayName: string
  role: "ADMIN" | "USER"
}

// Cached per request, so a page and the three components inside it that each
// need the user share one query.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const sessionId = await getSessionId()
  if (!sessionId) return null

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      expiresAt: true,
      user: {
        select: { id: true, username: true, displayName: true, role: true, isActive: true },
      },
    },
  })

  if (!session || session.expiresAt < new Date()) return null
  if (!session.user.isActive) return null

  const { id, username, displayName, role } = session.user
  return { id, username, displayName, role }
})

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser()
  // A non-admin reaching an admin route is told the page does not exist rather
  // than that it exists and is forbidden.
  if (user.role !== "ADMIN") redirect("/")
  return user
}
