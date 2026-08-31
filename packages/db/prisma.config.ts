import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

import dotenv from "dotenv"
import { defineConfig } from "prisma/config"

// The app's env file lives with the Next.js app, which is where `vercel env
// pull` and Next both expect it. Prisma runs from this package, so point it
// there explicitly rather than relying on cwd.
const here = dirname(fileURLToPath(import.meta.url))
for (const candidate of ["../../apps/web/.env.local", "../../.env.local", ".env"]) {
  const path = resolve(here, candidate)
  if (existsSync(path)) dotenv.config({ path })
}

// Migrations need a direct, unpooled connection — a pooled one cannot hold the
// advisory locks migrate takes. Neon exposes that as DATABASE_URL_UNPOOLED.
const migrationUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  ""

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
})
