import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { clearDraft, draftKey, readDraft, writeDraft } from "./use-draft"

// The draft is the last line of defence for a document the server never
// accepted, so its failure modes matter more than its happy path: every one of
// these paths has to end in "no draft" rather than a thrown error, because a
// throw here would stop the editor opening or a keystroke registering.

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  } as unknown as Storage
}

beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()))
afterEach(() => vi.unstubAllGlobals())

describe("draft storage", () => {
  it("round-trips a draft", () => {
    writeDraft("receipt:new", { note: "برف", items: [1, 2] })
    expect(readDraft("receipt:new")).toEqual({ note: "برف", items: [1, 2] })
  })

  it("reports no draft when none was stored", () => {
    expect(readDraft("receipt:new")).toBeNull()
  })

  it("keys drafts per document, so two editors never collide", () => {
    writeDraft("pricelist:new", { a: 1 })
    writeDraft("manreceipt:new", { a: 2 })
    expect(readDraft("pricelist:new")).toEqual({ a: 1 })
    expect(readDraft("manreceipt:new")).toEqual({ a: 2 })
  })

  it("namespaces its keys so it cannot collide with other app state", () => {
    expect(draftKey("receipt:new")).toBe("receipt-maker:draft:receipt:new")
  })

  it("clears the copy once the server has the document", () => {
    writeDraft("receipt:new", { a: 1 })
    clearDraft("receipt:new")
    expect(readDraft("receipt:new")).toBeNull()
  })

  it("ignores a corrupt draft rather than throwing", () => {
    localStorage.setItem(draftKey("receipt:new"), "{not json")
    expect(readDraft("receipt:new")).toBeNull()
  })

  it("ignores a draft written in some other shape", () => {
    localStorage.setItem(draftKey("receipt:new"), JSON.stringify({ nope: true }))
    expect(readDraft("receipt:new")).toBeNull()
  })

  it("survives storage that throws on every access", () => {
    const blocked = () => {
      throw new Error("blocked")
    }
    vi.stubGlobal("localStorage", {
      getItem: blocked,
      setItem: blocked,
      removeItem: blocked,
    } as unknown as Storage)

    expect(readDraft("receipt:new")).toBeNull()
    expect(() => writeDraft("receipt:new", { a: 1 })).not.toThrow()
    expect(() => clearDraft("receipt:new")).not.toThrow()
  })

  it("survives storage being absent entirely", () => {
    vi.stubGlobal("localStorage", undefined)
    expect(readDraft("receipt:new")).toBeNull()
    expect(() => writeDraft("receipt:new", { a: 1 })).not.toThrow()
    expect(() => clearDraft("receipt:new")).not.toThrow()
  })
})
