import { describe, expect, it } from "vitest"

import {
  addDays,
  PRESET_KEYS,
  bucketDays,
  daysBetween,
  isPresetKey,
  resolvePreset,
  resolveRange,
  toIsoDate,
  type DateRange,
  type DayTotal,
} from "./analytics"

// The whole earnings panel is built on these — a wrong window silently reports
// the wrong income for a period, which is worse than an error.

describe("resolvePreset", () => {
  it("counts today as one of the days in the window", () => {
    // A rolling quarter ending today is today plus the 89 before it, not today
    // minus 90 — otherwise every window hides this morning's sheet.
    expect(resolvePreset("quarter", "2026-09-03")).toEqual({
      key: "quarter",
      from: "2026-06-06",
      to: "2026-09-03",
    })
    expect(daysBetween("2026-06-06", "2026-09-03") + 1).toBe(90)
  })

  it("starts this month at its first day", () => {
    expect(resolvePreset("month", "2026-09-03").from).toBe("2026-09-01")
    expect(resolvePreset("month", "2026-01-31").from).toBe("2026-01-01")
  })

  it("leaves all-time unbounded below", () => {
    expect(resolvePreset("all", "2026-09-03").from).toBeNull()
  })

  it("crosses month and year boundaries", () => {
    expect(resolvePreset("quarter", "2026-01-03").from).toBe("2025-10-06")
    expect(resolvePreset("month", "2026-03-01").from).toBe("2026-03-01")
  })

  it("offers no two presets that resolve to nearly the same window", () => {
    // The chip row is the reason this list is short: two windows a day apart
    // read as duplicates and make the reader work out the difference.
    const today = "2026-09-17"
    const spans = PRESET_KEYS.filter((k) => k !== "all").map((k) => {
      const r = resolvePreset(k, today)
      return daysBetween(r.from!, r.to)
    })
    const sorted = [...spans].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThan(3)
    }
  })
})

describe("resolvePreset — today and this week", () => {
  it("makes today a single-day window", () => {
    expect(resolvePreset("today", "2026-09-03")).toEqual({
      key: "today",
      from: "2026-09-03",
      to: "2026-09-03",
    })
  })

  it("starts the week on Saturday, matching the app's calendar", () => {
    // 2026-09-03 is a Thursday; the Saturday before it is 2026-08-29.
    expect(new Date(2026, 8, 3).getDay()).toBe(4)
    expect(resolvePreset("week", "2026-09-03").from).toBe("2026-08-29")
  })

  it("leaves a Saturday as its own week start", () => {
    expect(new Date(2026, 7, 29).getDay()).toBe(6)
    expect(resolvePreset("week", "2026-08-29").from).toBe("2026-08-29")
  })

  it("keeps a Friday in the week that began the day before", () => {
    expect(new Date(2026, 8, 4).getDay()).toBe(5)
    expect(resolvePreset("week", "2026-09-04").from).toBe("2026-08-29")
  })
})

describe("resolveRange — custom windows from the URL", () => {
  it("takes a well-formed custom range as given", () => {
    expect(
      resolveRange(
        { range: "custom", from: "2026-07-01", to: "2026-07-31" },
        "2026-09-03"
      )
    ).toEqual({ key: "custom", from: "2026-07-01", to: "2026-07-31" })
  })

  it("swaps a range whose ends arrive backwards", () => {
    // A slip on the calendar, not a request for an empty result.
    expect(
      resolveRange(
        { range: "custom", from: "2026-07-31", to: "2026-07-01" },
        "2026-09-03"
      )
    ).toEqual({ key: "custom", from: "2026-07-01", to: "2026-07-31" })
  })

  it("clamps an end date past today", () => {
    expect(
      resolveRange(
        { range: "custom", from: "2026-08-01", to: "2027-01-01" },
        "2026-09-03"
      ).to
    ).toBe("2026-09-03")
  })

  it("falls back when a custom range is incomplete or malformed", () => {
    const fallback = resolvePreset("month", "2026-09-03")
    expect(resolveRange({ range: "custom", from: "2026-08-01" }, "2026-09-03")).toEqual(
      fallback
    )
    expect(
      resolveRange({ range: "custom", from: "yesterday", to: "today" }, "2026-09-03")
    ).toEqual(fallback)
  })

  it("falls back on an unknown range key", () => {
    expect(resolveRange({ range: "365" }, "2026-09-03")).toEqual(
      resolvePreset("month", "2026-09-03")
    )
    expect(resolveRange({}, "2026-09-03")).toEqual(
      resolvePreset("month", "2026-09-03")
    )
    // Keys that used to exist must not quietly resolve any more.
    expect(resolveRange({ range: "7" }, "2026-09-03").key).toBe("month")
    expect(resolveRange({ range: "30" }, "2026-09-03").key).toBe("month")
  })

  it("resolves a preset named in the params", () => {
    expect(resolveRange({ range: "today" }, "2026-09-03").key).toBe("today")
    expect(resolveRange({ range: "all" }, "2026-09-03").from).toBeNull()
  })
})

describe("isPresetKey", () => {
  it("rejects anything not a known key", () => {
    expect(isPresetKey("month")).toBe(true)
    expect(isPresetKey("all")).toBe(true)
    expect(isPresetKey("30")).toBe(false)
    expect(isPresetKey("365")).toBe(false)
    expect(isPresetKey("custom")).toBe(false)
    expect(isPresetKey(undefined)).toBe(false)
  })
})

describe("addDays", () => {
  it("crosses months, years and leap days", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01")
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31")
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29")
  })
})

describe("toIsoDate", () => {
  it("reads the local calendar, not UTC", () => {
    // The trap this exists to avoid: toISOString() on a local midnight shifts
    // the date backwards for anyone east of Greenwich.
    expect(toIsoDate(new Date(2026, 8, 3))).toBe("2026-09-03")
    expect(toIsoDate(new Date(2026, 0, 1))).toBe("2026-01-01")
  })
})

const range = (from: string | null, to: string): DateRange =>
  ({ key: "month", from, to }) as DateRange

const day = (date: string, amount: number, sheets = 1): DayTotal => ({
  date,
  amount,
  sheets,
})

describe("bucketDays", () => {
  it("fills days with no sheet as explicit zeroes", () => {
    const buckets = bucketDays(
      [day("2026-09-01", 100), day("2026-09-03", 50)],
      range("2026-09-01", "2026-09-03")
    )

    expect(buckets.map((b) => b.start)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ])
    expect(buckets.map((b) => b.amount)).toEqual([100, 0, 50])
    expect(buckets.map((b) => b.sheets)).toEqual([1, 0, 1])
  })

  it("keeps one bucket per day up to 31 days", () => {
    const buckets = bucketDays(
      [day("2026-08-20", 10)],
      range("2026-08-05", "2026-09-03")
    )
    expect(buckets).toHaveLength(30)
    expect(buckets.every((b) => b.start === b.end)).toBe(true)
  })

  it("groups a long window into weeks and lands the partial bucket at the start", () => {
    // Buckets are laid out backwards from today, so the newest column is a
    // whole week and any short remainder falls at the old end.
    const buckets = bucketDays(
      [day("2026-07-01", 10)],
      range("2026-06-06", "2026-09-03")
    )

    expect(buckets.length).toBeLessThan(30)
    expect(buckets[buckets.length - 1]!.end).toBe("2026-09-03")
    expect(buckets[0]!.start).toBe("2026-06-06")
    expect(daysBetween(buckets[buckets.length - 1]!.start, "2026-09-03") + 1).toBe(7)
  })

  it("sums every day inside a grouped bucket", () => {
    const buckets = bucketDays(
      [day("2026-09-01", 100), day("2026-09-02", 40, 2), day("2026-09-03", 10)],
      range("2026-06-06", "2026-09-03")
    )
    const last = buckets[buckets.length - 1]!

    expect(last.amount).toBe(150)
    expect(last.sheets).toBe(4)
  })

  it("spans all-time from the earliest day that has data", () => {
    const buckets = bucketDays(
      [day("2026-09-01", 100), day("2026-09-03", 50)],
      range(null, "2026-09-03")
    )

    expect(buckets[0]!.start).toBe("2026-09-01")
    expect(buckets).toHaveLength(3)
  })

  it("returns nothing when the window holds no sheets", () => {
    // A row of zero-height columns under an axis is a chart of nothing; the
    // caller shows an empty state instead.
    expect(bucketDays([], range(null, "2026-09-03"))).toEqual([])
    expect(bucketDays([], range("2026-08-05", "2026-09-03"))).toEqual([])
  })

  it("covers the range exactly, with no gap or overlap between buckets", () => {
    const buckets = bucketDays(
      [day("2026-07-01", 10)],
      range("2026-06-06", "2026-09-03")
    )

    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i]!.start).toBe(addDays(buckets[i - 1]!.end, 1))
    }
  })
})
