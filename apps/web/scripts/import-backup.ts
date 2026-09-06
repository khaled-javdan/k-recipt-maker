import { readFile } from "node:fs/promises"
import { prisma } from "@workspace/db"
import { normalizeUsername } from "@workspace/db/password"

import { findNumberCollisions, runImport } from "@/lib/import-core"
import { importLogo } from "@/lib/import-logo"
import { backupSchema } from "@/lib/import-schema"

// Loads a backup file exported from the old localStorage app into one user's
// account.
//
//   pnpm db:import <file.json> --user <username> [--dry-run] [--skip-logo]
//
// --skip-logo leaves Settings.logoUrl exactly as it is, for when the logo has
// already been uploaded by hand and re-uploading it would only orphan a blob.
//
// This is the path a real migration takes rather than the admin import screen:
// the file arrives from someone else's device, and a backup carrying a base64
// logo can exceed the server action body limit on its own.

type Args = { file: string; username: string; dryRun: boolean; skipLogo: boolean }

function parseArgs(argv: string[]): Args {
  const positional: string[] = []
  let username = ""
  let dryRun = false
  let skipLogo = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === "--dry-run") dryRun = true
    else if (arg === "--skip-logo") skipLogo = true
    else if (arg === "--user") username = argv[++i] ?? ""
    else if (arg.startsWith("--user=")) username = arg.slice("--user=".length)
    else positional.push(arg)
  }

  const file = positional[0] ?? ""
  if (!file || !username) {
    console.error(
      "Usage: pnpm db:import <file.json> --user <username> [--dry-run] [--skip-logo]"
    )
    process.exit(1)
  }
  return { file, username, dryRun, skipLogo }
}

// Thrown to unwind the transaction on a dry run. Rolling back real inserts is
// a far better rehearsal than skipping them: it exercises every column type and
// unique constraint the real run will hit.
class DryRun extends Error {
  constructor(readonly summary: Record<string, number>) {
    super("dry run")
  }
}

const { file, username, dryRun, skipLogo } = parseArgs(process.argv.slice(2))

const raw = await readFile(file, "utf8").catch((error: NodeJS.ErrnoException) => {
  console.error(`Could not read ${file}: ${error.message}`)
  process.exit(1)
})

let json: unknown
try {
  json = JSON.parse(raw)
} catch (error) {
  console.error(`${file} is not valid JSON: ${(error as Error).message}`)
  process.exit(1)
}

const parsed = backupSchema.safeParse(json)
if (!parsed.success) {
  console.error("Backup file is not valid:")
  for (const issue of parsed.error.issues.slice(0, 10)) {
    console.error(`  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
  }
  process.exit(1)
}

const data = parsed.data.data

const collisions = findNumberCollisions(data)
if (collisions.length) {
  console.error("Duplicate document numbers in the backup — nothing was written:")
  for (const line of collisions) console.error(`  ${line}`)
  process.exit(1)
}

const user = await prisma.user.findUnique({
  where: { username: normalizeUsername(username) },
  select: { id: true, username: true, displayName: true },
})

if (!user) {
  console.error(
    `No user "${username}". Create the account first, then re-run — this script imports into an existing user rather than inventing one.`
  )
  process.exit(1)
}

console.log(`File     ${file}`)
console.log(`Exported ${parsed.data.exportedAt ?? "unknown"}`)
console.log(`Target   ${user.displayName} (${user.username})`)
console.log(dryRun ? "Mode     dry run — rolled back\n" : "Mode     WRITE — replaces this user's data\n")

const logo = skipLogo
  ? ({ status: "absent" } as const)
  : await importLogo(user.id, data.company?.logo)
if (skipLogo) console.log("Logo     left as-is (--skip-logo)")
if (logo.status === "skipped") console.warn(`Logo not migrated: ${logo.reason}`)
if (logo.status === "uploaded") console.log(`Logo uploaded: ${logo.url}`)

let summary: Record<string, number>
try {
  summary = await prisma.$transaction(
    async (tx) => {
      const result = await runImport(tx, user.id, data, {
        logoUrl: logo.status === "uploaded" ? logo.url : undefined,
      })
      if (dryRun) throw new DryRun(result)
      return result
    },
    { timeout: 120_000, maxWait: 15_000 }
  )
} catch (error) {
  if (error instanceof DryRun) {
    summary = error.summary
  } else {
    console.error(`\nImport failed, nothing was written: ${(error as Error).message}`)
    await prisma.$disconnect()
    process.exit(1)
  }
}

console.log()
for (const [key, count] of Object.entries(summary)) {
  console.log(`  ${key.padEnd(12)} ${count}`)
}
console.log(
  dryRun
    ? "\nDry run complete — rolled back. Re-run without --dry-run to write."
    : "\nImport complete."
)

await prisma.$disconnect()
