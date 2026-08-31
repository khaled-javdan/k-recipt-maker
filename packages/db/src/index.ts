import { PrismaNeon } from "@prisma/adapter-neon"

import { PrismaClient } from "../generated/client/client"

export * from "../generated/client/client"

// Next.js reloads modules on every edit in development, and each reload would
// otherwise open a fresh connection pool until Neon refuses new ones. Holding
// the client on globalThis keeps one pool across reloads.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>
}

function createClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Run `vercel env pull apps/web/.env.local` or copy .env.example."
    )
  }
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
