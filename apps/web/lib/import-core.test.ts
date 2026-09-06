import { describe, expect, it } from "vitest"

import type { Prisma } from "@workspace/db"

import { findNumberCollisions, runImport } from "./import-core"
import { backupSchema } from "./import-schema"

// The importer's job is to land data that agrees with what the old app printed.
// The figure that matters most is حق: it is stored rather than derived, the
// earnings panel sums it, and a wrong one is invisible until someone reconciles
// money by hand.

type Created = Record<string, unknown>

// Records what the importer would write. runImport only ever creates, upserts
// and deletes, so a recorder is enough to assert on — and it keeps the test
// free of a database.
function recorder() {
  const created: Record<string, Created[]> = {}
  const upserted: Record<string, Created[]> = {}

  const model = (name: string) => ({
    deleteMany: async () => ({ count: 0 }),
    create: async (args: { data: Created }) => {
      ;(created[name] ??= []).push(args.data)
      return { id: `${name}-${created[name]!.length}` }
    },
    createMany: async (args: { data: Created[] }) => {
      ;(created[name] ??= []).push(...args.data)
      return { count: args.data.length }
    },
    upsert: async (args: { create: Created; update: Created; where: Created }) => {
      ;(upserted[name] ??= []).push({ ...args.create, where: args.where })
      return { id: `${name}-upsert` }
    },
  })

  const tx = new Proxy({} as Prisma.TransactionClient, {
    get: (_t, prop: string) => model(prop),
  })

  return { tx, created, upserted }
}

function parse(data: Record<string, unknown>) {
  const parsed = backupSchema.safeParse({
    app: "receipt-maker",
    version: 1,
    exportedAt: "2026-09-06T00:00:00.000Z",
    data,
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message)
  return parsed.data.data
}

describe("runImport — حق (commissionAmount)", () => {
  it("stores a percentage commission snapped to five, not the raw percentage", async () => {
    const { tx, created } = recorder()
    // 2.5% of 1470 is 36.75; the sheet charges 35.
    await runImport(tx, "u1", parse({
      priceLists: [
        {
          number: 1001,
          title: "مزاد",
          date: "2026-09-01",
          commission: 2.5,
          commissionIsPercent: true,
          items: [{ name: "هامور", price: 1470 }],
        },
      ],
    }))

    expect(created.priceList?.[0]).toMatchObject({ commissionAmount: 35 })
  })

  it("snaps a flat commission too", async () => {
    const { tx, created } = recorder()
    await runImport(tx, "u1", parse({
      priceLists: [
        {
          number: 1001,
          title: "مزاد",
          date: "2026-09-01",
          commission: 36.75,
          items: [{ name: "هامور", price: 100 }],
        },
      ],
    }))

    expect(created.priceList?.[0]).toMatchObject({ commissionAmount: 35 })
  })

  it("derives فیش من line amounts from weight and the per-من rate", async () => {
    const { tx, created } = recorder()
    // 23 kg at 96 per من is 552, which snaps to 550. 10% of that is 55.
    await runImport(tx, "u1", parse({
      manReceipts: [
        {
          number: 1001,
          title: "من",
          date: "2026-09-01",
          commission: 10,
          commissionIsPercent: true,
          items: [{ name: "هامور", weight: 23, pricePerMan: 96 }],
        },
      ],
    }))

    expect(created.manReceipt?.[0]).toMatchObject({ commissionAmount: 55 })
  })

  it("never leaves حق at the column default when one was charged", async () => {
    const { tx, created } = recorder()
    await runImport(tx, "u1", parse({
      priceLists: [
        { number: 1001, title: "a", date: "2026-09-01", commission: 50, items: [{ name: "x", price: 900 }] },
      ],
      manReceipts: [
        { number: 1001, title: "b", date: "2026-09-01", commission: 25, items: [{ name: "y", weight: 8, pricePerMan: 100 }] },
      ],
    }))

    expect(created.priceList?.[0]).toMatchObject({ commissionAmount: 50 })
    expect(created.manReceipt?.[0]).toMatchObject({ commissionAmount: 25 })
  })
})

describe("runImport — legacy expenses", () => {
  it("folds the old scalar expenses field into a single line", async () => {
    const { tx, created } = recorder()
    await runImport(tx, "u1", parse({
      priceLists: [
        { number: 1001, title: "a", date: "2026-09-01", expenses: 120, items: [{ name: "x", price: 900 }] },
      ],
    }))

    expect(created.priceList?.[0]).toMatchObject({
      expenses: { create: [{ position: 0, label: "هزینه", amount: 120 }] },
    })
  })

  it("prefers itemised lines when both shapes are present", async () => {
    const { tx, created } = recorder()
    await runImport(tx, "u1", parse({
      priceLists: [
        {
          number: 1001,
          title: "a",
          date: "2026-09-01",
          expenses: 120,
          expenseItems: [{ label: "برف", amount: 40 }],
          items: [{ name: "x", price: 900 }],
        },
      ],
    }))

    expect(created.priceList?.[0]).toMatchObject({
      expenses: { create: [{ position: 0, label: "برف", amount: 40 }] },
    })
  })
})

describe("runImport — numbering", () => {
  it("resumes from the old app's counter, not just the highest surviving document", async () => {
    const { tx, upserted } = recorder()
    // The client deleted receipts 1240-1247; the counter still knows about them.
    await runImport(tx, "u1", parse({
      receipts: [{ number: 1239, date: "2026-09-01", items: [] }],
      counters: { receipt: 1247 },
    }))

    const receiptCounter = upserted.counter?.find((c) => c.kind === "RECEIPT")
    expect(receiptCounter).toMatchObject({ value: 1247 })
  })

  it("falls back to the highest document when the counter is behind", async () => {
    const { tx, upserted } = recorder()
    await runImport(tx, "u1", parse({
      receipts: [{ number: 1300, date: "2026-09-01", items: [] }],
      counters: { receipt: 1100 },
    }))

    expect(upserted.counter?.find((c) => c.kind === "RECEIPT")).toMatchObject({ value: 1300 })
  })

  it("never drops below the 1000 floor", async () => {
    const { tx, upserted } = recorder()
    await runImport(tx, "u1", parse({}))
    for (const counter of upserted.counter ?? []) {
      expect(counter.value).toBe(1000)
    }
  })
})

describe("runImport — dates", () => {
  it("falls back to createdAt when the stored date is unusable", async () => {
    const { tx, created } = recorder()
    await runImport(tx, "u1", parse({
      priceLists: [
        { number: 1001, title: "a", date: "", createdAt: Date.UTC(2026, 4, 17), items: [] },
      ],
    }))

    // An empty date would drop the sheet out of every earnings range query.
    expect(created.priceList?.[0]).toMatchObject({ date: "2026-05-17" })
  })

  it("keeps a valid date untouched", async () => {
    const { tx, created } = recorder()
    await runImport(tx, "u1", parse({
      priceLists: [{ number: 1001, title: "a", date: "2026-09-01", items: [] }],
    }))

    expect(created.priceList?.[0]).toMatchObject({ date: "2026-09-01" })
  })
})

describe("runImport — absent optional fields", () => {
  // z.coerce.string() turns an absent key into the literal "undefined", which
  // once stored 153 notes reading "undefined" on real sheets.
  it("leaves a missing note null rather than the string \"undefined\"", async () => {
    const { tx, created } = recorder()
    await runImport(tx, "u1", parse({
      receipts: [{ number: 1001, date: "2026-09-01", items: [] }],
      ledgers: [{ number: 1001, title: "a", date: "2026-09-01", rows: [] }],
      priceLists: [{ number: 1001, title: "a", date: "2026-09-01", items: [] }],
      manReceipts: [{ number: 1001, title: "a", date: "2026-09-01", items: [] }],
    }))

    for (const model of ["receipt", "ledger", "priceList", "manReceipt"]) {
      expect(created[model]?.[0]).toMatchObject({ notes: null })
    }
  })

  it("leaves a missing phone and address null on a client", async () => {
    const { tx, created } = recorder()
    await runImport(tx, "u1", parse({ clients: [{ name: "شوکت" }] }))
    expect(created.client?.[0]).toMatchObject({ phone: null, address: null })
  })

  it("keeps a real note", async () => {
    const { tx, created } = recorder()
    await runImport(tx, "u1", parse({
      priceLists: [{ number: 1001, title: "a", date: "2026-09-01", notes: "برف", items: [] }],
    }))
    expect(created.priceList?.[0]).toMatchObject({ notes: "برف" })
  })
})

describe("findNumberCollisions", () => {
  it("names duplicated document numbers before anything is written", () => {
    const problems = findNumberCollisions(parse({
      receipts: [
        { number: 1001, date: "2026-09-01", items: [] },
        { number: 1001, date: "2026-09-02", items: [] },
      ],
    }))

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain("1001")
  })

  it("is quiet when every number is unique", () => {
    expect(
      findNumberCollisions(parse({
        receipts: [
          { number: 1001, date: "2026-09-01", items: [] },
          { number: 1002, date: "2026-09-02", items: [] },
        ],
      }))
    ).toEqual([])
  })
})
