import { describe, expect, it } from "vitest"

import { insertAt, moveRow, removeAt, replaceAt } from "./rows"

describe("row helpers", () => {
  const rows = ["a", "b", "c"]

  it("inserts at an index", () => {
    expect(insertAt(rows, 1, "x")).toEqual(["a", "x", "b", "c"])
  })

  it("clamps an out-of-range insert instead of creating holes", () => {
    expect(insertAt(rows, 99, "x")).toEqual(["a", "b", "c", "x"])
    expect(insertAt(rows, -5, "x")).toEqual(["x", "a", "b", "c"])
  })

  it("removes and replaces", () => {
    expect(removeAt(rows, 1)).toEqual(["a", "c"])
    expect(replaceAt(rows, 1, "x")).toEqual(["a", "x", "c"])
  })

  it("moves a row", () => {
    expect(moveRow(rows, 0, 2)).toEqual(["b", "c", "a"])
    expect(moveRow(rows, 2, 0)).toEqual(["c", "a", "b"])
  })

  it("ignores a move that would fall off either end", () => {
    expect(moveRow(rows, 0, -1)).toBe(rows)
    expect(moveRow(rows, 2, 3)).toBe(rows)
  })

  it("does not mutate the input", () => {
    const original = [...rows]
    insertAt(rows, 1, "x")
    moveRow(rows, 0, 2)
    removeAt(rows, 0)
    expect(rows).toEqual(original)
  })
})
