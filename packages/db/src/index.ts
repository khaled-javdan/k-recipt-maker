import { PrismaNeon } from "@prisma/adapter-neon"

import { PrismaClient } from "../generated/client/client"

export * from "../generated/client/client"

// Next.js reloads modules on every edit in development, and each reload would
// otherwise open a fresh connection pool until Neon refuses new ones. Holding
// the client on globalThis keeps one pool across reloads.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

let client: PrismaClient | undefined

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

function getClient(): PrismaClient {
  client ??= globalForPrisma.prisma ?? createClient()
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client
  return client
}

// `next build` evaluates route modules to collect their config, which would
// construct the client — and throw on a missing DATABASE_URL — before any query
// runs. Deferring construction to the first property access keeps the
// connection string a request-time requirement rather than a build-time one.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getClient()
    const value = Reflect.get(instance, prop) as unknown
    return typeof value === "function" ? value.bind(instance) : value
  },
  has(_target, prop) {
    return Reflect.has(getClient(), prop)
  },
})
