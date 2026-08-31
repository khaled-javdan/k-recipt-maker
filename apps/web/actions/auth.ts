"use server"

import { redirect } from "next/navigation"
import { prisma } from "@workspace/db"
import { normalizeUsername, verifyPassword } from "@workspace/db/password"

import { fa } from "@/lib/fa"
import { createSession, destroySession } from "@/lib/session"

export type SignInState = { error?: string }

// A bcrypt hash of a value nobody can type. Verifying against it when the
// username is unknown keeps the failure path the same cost as a real one, so
// response time doesn't reveal which usernames exist.
const DUMMY_HASH = "$2b$12$Yn0SfD0jrC//9.Sx81rtzuVxtlbOE6mJQjMeqYJeZHsQRZXUdmPfu"

export async function signIn(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""))
  const password = String(formData.get("password") ?? "")
  const next = String(formData.get("next") ?? "")

  if (!username || !password) return { error: fa.auth.missingFields }

  const user = await prisma.user.findUnique({ where: { username } })
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)

  // Same message for "no such user" and "wrong password", so the page cannot
  // be used to enumerate accounts.
  if (!user || !ok) return { error: fa.auth.invalid }
  if (!user.isActive) return { error: fa.auth.inactive }

  await createSession(user.id)

  // Only ever follow an in-app path, so a crafted ?next= can't bounce someone
  // to another site immediately after they authenticate.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/"
  redirect(safeNext)
}

export async function signOut(): Promise<void> {
  await destroySession()
  redirect("/login")
}
