import "./env"

import { prisma } from "../src/index"
import { hashPassword, normalizeUsername } from "../src/password"

// Creates the first admin account. There is no public signup, so without this
// there is no way into the app at all.
//
// Safe to re-run: an existing admin has their password reset to the seed value
// rather than being duplicated.

const username = normalizeUsername(process.env.SEED_ADMIN_USERNAME ?? "admin")
const password = process.env.SEED_ADMIN_PASSWORD
const displayName = process.env.SEED_ADMIN_NAME ?? "مدیر"

if (!password) {
  console.error(
    "SEED_ADMIN_PASSWORD is not set. Add it to apps/web/.env.local before seeding."
  )
  process.exit(1)
}

if (password.length < 8) {
  console.error("SEED_ADMIN_PASSWORD must be at least 8 characters.")
  process.exit(1)
}

const passwordHash = await hashPassword(password)

const user = await prisma.user.upsert({
  where: { username },
  update: { passwordHash, role: "ADMIN", isActive: true },
  create: { username, passwordHash, displayName, role: "ADMIN" },
})

// Every user needs a settings row; the app reads it on every page that prints.
await prisma.settings.upsert({
  where: { userId: user.id },
  update: {},
  create: { userId: user.id },
})

console.log(`Seeded admin "${user.username}" (${user.id})`)
await prisma.$disconnect()
