import { describe, expect, it } from "vitest"
import * as old from "./__fixtures__/legacy"
import * as next from "./index"

// Differential test: runs the original app's calculations and the rewrite
// against the same randomised inputs and asserts they agree. This is the
// safety net for the one part of the migration where being wrong is both
// expensive and invisible.
const rnd = (() => {
  let seed = 42
  return () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
})()

const nums = Array.from({ length: 3000 }, () => Math.round(rnd() * 40000) / 100)

describe("parity with the original app", () => {
  it("snapToFive", () => {
    for (const n of nums) expect(next.snapToFive(n)).toBe(old.snapToFive(n))
  })

  it("snapPriceInput", () => {
    for (const n of nums) {
      const s = String(n)
      expect(next.snapPriceInput(s)).toBe(old.snapPriceInput(s))
    }
    for (const s of ["", "  ", "abc", "12abc", "-5", "0", "1e3"]) {
      expect(next.snapPriceInput(s)).toBe(old.snapPriceInput(s))
    }
  })

  it("manLineAmount", () => {
    for (let i = 0; i < nums.length - 1; i++) {
      const item = { weight: nums[i]!, pricePerMan: nums[i + 1]! }
      expect(next.manLineAmount(item)).toBe(old.manLineAmount(item))
    }
  })

  it("pricePerKg / pricePerManFromKg", () => {
    for (const n of nums) {
      expect(next.pricePerKg(n)).toBe(old.pricePerKg(n))
      expect(next.pricePerManFromKg(n)).toBe(old.pricePerManFromKg(n))
    }
  })

  it("deductionTotals vs priceListTotals", () => {
    for (let i = 0; i + 5 < nums.length; i += 6) {
      const items = [{ price: nums[i]! }, { price: nums[i + 1]! }, { price: nums[i + 2]! }]
      const expenseItems = [{ amount: nums[i + 3]! }, { amount: nums[i + 4]! }]
      const commission = nums[i + 5]!
      for (const isPct of [false, true]) {
        const o = old.priceListTotals({ items, expenseItems, commission, commissionIsPercent: isPct })
        const n = next.deductionTotals({
          lineAmounts: items.map((it) => it.price),
          expenses: expenseItems,
          commission,
          commissionIsPercent: isPct,
        })
        expect(n).toEqual({
          subtotal: o.subtotal,
          commission: o.commission,
          expenses: o.expenses,
          grandTotal: o.grandTotal,
        })
      }
    }
  })

  it("manReceiptTotals", () => {
    for (let i = 0; i + 4 < nums.length; i += 5) {
      const items = [
        { weight: nums[i]!, pricePerMan: nums[i + 1]! },
        { weight: nums[i + 2]!, pricePerMan: nums[i + 3]! },
      ]
      const expenseItems = [{ amount: nums[i + 4]! }]
      const o = old.manReceiptTotals({ items, expenseItems, commission: 2.5, commissionIsPercent: true })
      const n = next.manReceiptTotals({ items, expenses: expenseItems, commission: 2.5, commissionIsPercent: true })
      expect(n.subtotal).toBe(o.subtotal)
      expect(n.commission).toBe(o.commission)
      expect(n.expenses).toBe(o.expenses)
      expect(n.grandTotal).toBe(o.grandTotal)
      expect(n.totalWeight).toBe(o.totalWeight)
    }
  })

  it("rowBalance and the running ledger balance", () => {
    for (let i = 0; i + 8 < nums.length; i += 9) {
      const rows = [0, 3, 6].map((k) => ({
        invoice: nums[i + k]!,
        commission: nums[i + k + 1]!,
        cash: nums[i + k + 2]!,
      }))
      for (const r of rows) expect(next.rowBalance(r)).toBe(old.rowBalance(r))
      let acc = 0
      const expected = rows.map((r) => (acc += old.rowBalance(r)))
      const got = next.ledgerBalances(rows)
      expect(got.cumulative).toEqual(expected)
      expect(got.grandTotal).toBe(expected[expected.length - 1])
    }
  })

  it("layoutColumns", () => {
    for (let count = 0; count <= 120; count++) {
      const items = Array.from({ length: count }, (_, i) => i)
      for (const [per, max] of [[30, 3], [2, 2], [10, 5], [1, 1], [0, 0]] as const) {
        expect(next.layoutColumns(items, per, max)).toEqual(old.layoutColumns(items, per, max))
      }
    }
  })

  it("formatters", () => {
    for (const n of nums) {
      expect(next.formatMoney(n)).toBe(old.formatMoney(n))
      expect(next.formatAmount(n)).toBe(old.formatAmount(n))
      expect(next.formatUnitWeight(n)).toBe(old.formatUnitWeight(n))
      expect(next.formatTotalWeight(n)).toBe(old.formatTotalWeight(n))
    }
    for (const n of [NaN, Infinity, -Infinity, 0]) {
      expect(next.formatMoney(n)).toBe(old.formatMoney(n))
      expect(next.formatAmount(n)).toBe(old.formatAmount(n))
      expect(next.formatUnitWeight(n)).toBe(old.formatUnitWeight(n))
      expect(next.formatTotalWeight(n)).toBe(old.formatTotalWeight(n))
    }
  })

  it("toLatinDigits", () => {
    const alphabet = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩0123456789 .,-هامور"
    for (let i = 0; i < 2000; i++) {
      let s = ""
      const len = 1 + Math.floor(rnd() * 12)
      for (let j = 0; j < len; j++) s += alphabet[Math.floor(rnd() * alphabet.length)]
      expect(next.toLatinDigits(s)).toBe(old.toLatinDigits(s))
    }
  })
})
