import "server-only"

import { cookies } from "next/headers"
import { prisma } from "@workspace/db"

// Sessions are opaque database rows rather than signed tokens, so an admin can
// end someone's session by deleting it — useful when a phone is lost, which on
// a shared market floor is the realistic threat.

const COOKIE_NAME = "rm_session"
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export { COOKIE_NAME }

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + MAX_AGE_MS)
  const session = await prisma.session.create({ data: { userId, expiresAt } })

  const store = await cookies()
  store.set(COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  const id = store.get(COOKIE_NAME)?.value
  if (id) {
    // The row may already be gone (expired sweep, admin revoke); deleteMany
    // makes that a no-op instead of a thrown error.
    await prisma.session.deleteMany({ where: { id } })
  }
  store.delete(COOKIE_NAME)
}

export async function getSessionId(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value
}
