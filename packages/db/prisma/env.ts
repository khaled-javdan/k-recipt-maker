// Side-effect module: loads the app's env file for scripts run through tsx
// (seed, smoke tests, one-off maintenance). The Next.js app does not need this
// — it loads apps/web/.env.local itself — so this stays out of src/.
import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import dotenv from "dotenv"

const here = dirname(fileURLToPath(import.meta.url))
for (const candidate of ["../../../apps/web/.env.local", "../../../.env.local"]) {
  const path = resolve(here, candidate)
  if (existsSync(path)) {
    dotenv.config({ path })
    break
  }
}
