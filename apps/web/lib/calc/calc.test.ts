import { describe, expect, it } from "vitest"
import {
  deductionTotals,
  formatAmount,
  formatMoney,
  formatTotalWeight,
  formatUnitWeight,
  layoutColumns,
  ledgerBalances,
  MAN_KG,
  manLineAmount,
  manReceiptTotals,
  parseNumber,
  pricePerKg,
  pricePerManFromKg,
  rowBalance,
  snapPriceInput,
  snapToFive,
  toLatinDigits,
} from "./index"

// These tests pin the behaviour of the original app. They are the contract the
// rewrite has to honour — a change here means different money on a printed
// sheet, so treat a failure as a bug in the change, not in the test.

describe("snapToFive", () => {
  it("rounds to the nearest multiple of five", () => {
    expect(snapToFive(31)).toBe(30)
    expect(snapToFive(57)).toBe(55)
    expect(snapToFive(36.75)).toBe(35)
    expect(snapToFive(552)).toBe(550)
  })

  it("rounds halfway cases up", () => {
    expect(snapToFive(2.5)).toBe(5)
    expect(snapToFive(7.5)).toBe(10)
  })

  it("leaves exact multiples alone", () => {
    expect(snapToFive(0)).toBe(0)
    expect(snapToFive(120)).toBe(120)
  })

  it("returns zero for non-finite input", () => {
    expect(snapToFive(NaN)).toBe(0)
    expect(snapToFive(Infinity)).toBe(0)
  })
})

describe("snapPriceInput", () => {
  it("keeps a blank field blank", () => {
    expect(snapPriceInput("")).toBe("")
    expect(snapPriceInput("   ")).toBe("")
  })

  it("snaps a typed number", () => {
    expect(snapPriceInput("57")).toBe("55")
    expect(snapPriceInput(" 31 ")).toBe("30")
  })

  it("leaves unparseable text alone rather than zeroing it", () => {
    expect(snapPriceInput("abc")).toBe("abc")
  })

  it("accepts Persian digits", () => {
    expect(snapPriceInput("۵۷")).toBe("55")
  })
})

describe("toLatinDigits", () => {
  it("converts Persian digits", () => {
    expect(toLatinDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789")
  })

  it("converts Arabic-Indic digits", () => {
    expect(toLatinDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789")
  })

  it("leaves other characters untouched", () => {
    expect(toLatinDigits("۱۲.۵ kg")).toBe("12.5 kg")
    expect(toLatinDigits("هامور")).toBe("هامور")
  })
})

describe("parseNumber", () => {
  it("parses Persian digits", () => {
    expect(parseNumber("۱۲۳")).toBe(123)
  })

  it("falls back to zero rather than NaN", () => {
    expect(parseNumber("abc")).toBe(0)
    expect(parseNumber("")).toBe(0)
  })
})

describe("من (man) pricing", () => {
  it("is four kilos to the من", () => {
    expect(MAN_KG).toBe(4)
  })

  it("snaps the line amount, not the quoted rate", () => {
    // 23 kg at 96 per من is 552 exactly; the sheet prints 550.
    expect(manLineAmount({ weight: 23, pricePerMan: 96 })).toBe(550)
  })

  it("handles a whole number of من without drift", () => {
    expect(manLineAmount({ weight: 8, pricePerMan: 100 })).toBe(200)
  })

  it("treats missing values as zero", () => {
    expect(manLineAmount({ weight: 0, pricePerMan: 96 })).toBe(0)
  })

  it("converts between kg and من rates", () => {
    expect(pricePerKg(96)).toBe(24)
    expect(pricePerManFromKg(24)).toBe(96)
    expect(pricePerManFromKg(pricePerKg(96))).toBe(96)
  })
})

describe("deductionTotals", () => {
  it("deducts a flat commission and expenses from the subtotal", () => {
    const t = deductionTotals({
      lineAmounts: [1000, 470],
      commission: 50,
      expenses: [{ amount: 20 }, { amount: 30 }],
    })
    expect(t.subtotal).toBe(1470)
    expect(t.commission).toBe(50)
    expect(t.expenses).toBe(50)
    expect(t.grandTotal).toBe(1370)
  })

  it("snaps a percentage commission to five", () => {
    // 2.5% of 1470 is 36.75 — the sheet charges 35.
    const t = deductionTotals({
      lineAmounts: [1470],
      commission: 2.5,
      commissionIsPercent: true,
    })
    expect(t.commission).toBe(35)
    expect(t.grandTotal).toBe(1435)
  })

  it("snaps a flat commission too", () => {
    const t = deductionTotals({ lineAmounts: [100], commission: 36.75 })
    expect(t.commission).toBe(35)
  })

  it("handles an empty sheet", () => {
    const t = deductionTotals({ lineAmounts: [] })
    expect(t).toEqual({ subtotal: 0, commission: 0, expenses: 0, grandTotal: 0 })
  })
})

describe("manReceiptTotals", () => {
  it("sums snapped line amounts and total weight", () => {
    const t = manReceiptTotals({
      items: [
        { weight: 23, pricePerMan: 96 }, // 550
        { weight: 8, pricePerMan: 100 }, // 200
      ],
      commission: 10,
      expenses: [{ amount: 40 }],
    })
    expect(t.subtotal).toBe(750)
    expect(t.totalWeight).toBe(31)
    expect(t.commission).toBe(10)
    expect(t.expenses).toBe(40)
    expect(t.grandTotal).toBe(700)
  })
})

describe("ledger balances", () => {
  it("computes a single row balance", () => {
    expect(rowBalance({ invoice: 100, commission: 5, cash: 40 })).toBe(65)
  })

  it("carries the balance forward across rows", () => {
    const { cumulative, grandTotal } = ledgerBalances([
      { invoice: 100, commission: 5, cash: 40 }, // 65
      { invoice: 200, commission: 10, cash: 50 }, // 160 -> 225
      { invoice: 0, commission: 0, cash: 25 }, // -25 -> 200
    ])
    expect(cumulative).toEqual([65, 225, 200])
    expect(grandTotal).toBe(200)
  })

  it("returns zero for an empty ledger", () => {
    expect(ledgerBalances([])).toEqual({ cumulative: [], grandTotal: 0 })
  })
})

describe("layoutColumns", () => {
  const items = (n: number) => Array.from({ length: n }, (_, i) => i)

  it("returns one empty column for no items", () => {
    expect(layoutColumns([], 30, 3)).toEqual([[]])
  })

  it("keeps a short list in a single column", () => {
    expect(layoutColumns(items(10), 30, 3)).toHaveLength(1)
  })

  it("balances across columns once one overflows", () => {
    const cols = layoutColumns(items(31), 30, 3)
    expect(cols.map((c) => c.length)).toEqual([16, 15])
  })

  it("fills column-major, not row-major", () => {
    const cols = layoutColumns(items(4), 2, 2)
    expect(cols).toEqual([
      [0, 1],
      [2, 3],
    ])
  })

  it("grows taller rather than exceeding the column cap", () => {
    const cols = layoutColumns(items(200), 30, 3)
    expect(cols).toHaveLength(3)
    expect(cols.flat()).toHaveLength(200)
  })

  it("survives nonsense configuration", () => {
    expect(layoutColumns(items(5), 0, 0)).toHaveLength(1)
  })
})

describe("formatting", () => {
  it("formats money with the currency prefix", () => {
    expect(formatMoney(1470)).toBe("AED 1,470")
    expect(formatMoney(1470.5)).toBe("AED 1,470.5")
    expect(formatMoney(NaN)).toBe("AED 0")
  })

  it("formats a bare amount without the currency", () => {
    expect(formatAmount(1470)).toBe("1,470")
    expect(formatAmount(NaN)).toBe("0")
  })

  it("strips trailing zeros from weights", () => {
    expect(formatUnitWeight(1.5)).toBe("1.5")
    expect(formatUnitWeight(2)).toBe("2")
    expect(formatUnitWeight(1.25)).toBe("1.25")
  })

  it("suffixes total weight with kg", () => {
    expect(formatTotalWeight(31)).toBe("31 kg")
    expect(formatTotalWeight(31.5)).toBe("31.5 kg")
  })
})
