// Earnings analytics for فیش مزاد.
//
// Everything here is pure: date arithmetic on ISO yyyy-mm-dd strings and
// bucketing of day totals into chart columns. The database query that feeds it
// lives in data.ts; keeping the shaping separate is what makes it testable
// without a database.
//
// Dates are the business date written on the sheet — a plain yyyy-mm-dd string,
// never a timestamp — so all arithmetic here goes through the local calendar
// and back out as a string. `new Date("2026-08-31")` is UTC midnight and reads
// back as the 30th west of Greenwich, the same trap formatSheetDate() documents.

// Ordered shortest to longest, which is the order they are shown in.
//
// Calendar periods, not rolling day counts: "this week" and "last 7 days" land
// within a day of each other, and a row of chips offering both just makes the
// reader work out the difference. Anything these five don't cover is what the
// date-range picker is for.
export const PRESET_KEYS = ["today", "week", "month", "quarter", "all"] as const
export type PresetKey = (typeof PRESET_KEYS)[number]

/** A preset, or a window the user picked on the calendar. */
export type RangeKey = PresetKey | "custom"

export const DEFAULT_RANGE: PresetKey = "month"

export function isPresetKey(value: string | undefined): value is PresetKey {
  return !!value && (PRESET_KEYS as readonly string[]).includes(value)
}

export type DateRange = {
  key: RangeKey
  /** Inclusive lower bound, or null for "all time" — no bound at all. */
  from: string | null
  /** Inclusive upper bound, never past today: sheets are not dated forward. */
  to: string
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso)
  if (!date) return iso
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/**
 * Every window is inclusive of today, so a sheet written this morning counts —
 * otherwise the shortest range reads as empty for most of the working day.
 */
export function resolvePreset(key: PresetKey, today: string): DateRange {
  switch (key) {
    case "today":
      return { key, from: today, to: today }
    case "week":
      return { key, from: startOfWeek(today), to: today }
    case "month":
      return { key, from: `${today.slice(0, 7)}-01`, to: today }
    case "quarter":
      // Rolling, not the calendar quarter: on the 1st of April a calendar
      // quarter would show a single day and hide the three months just worked.
      return { key, from: addDays(today, -89), to: today }
    case "all":
      return { key, from: null, to: today }
  }
}

/**
 * The week starts on Saturday — the calendar in this app already runs on the
 * faIR locale, and a week that starts on Monday would disagree with the one
 * the date picker draws.
 */
export function startOfWeek(iso: string): string {
  const date = parseIsoDate(iso)
  if (!date) return iso
  // getDay(): Sunday 0 … Saturday 6. Shifting by one puts Saturday at 0.
  return addDays(iso, -((date.getDay() + 1) % 7))
}

/**
 * Turns raw search params into a window. Everything here arrives from a URL
 * anyone can edit, so an unparseable or reversed range falls back or is
 * repaired rather than reaching the query.
 */
export function resolveRange(
  params: { range?: string; from?: string; to?: string },
  today: string
): DateRange {
  if (params.range === "custom") {
    const from = parseIsoDate(params.from ?? "") ? params.from! : null
    const to = parseIsoDate(params.to ?? "") ? params.to! : null

    if (from && to) {
      // A backwards range is a slip on the calendar, not a request for no
      // results, so the two ends are swapped rather than returning nothing.
      const [start, end] = from <= to ? [from, to] : [to, from]
      // Nothing is dated forward, so an end past today would only pad the
      // chart with empty columns.
      return { key: "custom", from: start, to: minIso(end, today) }
    }
  }

  return resolvePreset(
    isPresetKey(params.range) ? params.range : DEFAULT_RANGE,
    today
  )
}

export type DayTotal = { date: string; amount: number; sheets: number }

export type Bucket = {
  /** Inclusive start of the bucket, ISO. Also its identity. */
  start: string
  /** Inclusive end. Equal to `start` for daily buckets. */
  end: string
  amount: number
  sheets: number
}

/**
 * Day rows from the database are sparse — a day with no sheet has no row. The
 * chart needs the gaps as explicit zeroes, otherwise a quiet week renders as a
 * continuous bar and overstates how steady the earnings were.
 *
 * Long ranges are grouped so the column count stays readable: a 90-day window
 * as 90 bars is a barcode, as 13 weekly bars it is a trend.
 */
export function bucketDays(days: DayTotal[], range: DateRange): Bucket[] {
  // No sheets in the window at all: return nothing so the caller can say so.
  // A row of zero-height columns under an axis is a chart of nothing, and reads
  // as a rendering failure rather than as an empty period.
  if (days.length === 0) return []

  const first = range.from ?? days[0]!.date
  if (first > range.to) return []

  const byDate = new Map(days.map((d) => [d.date, d]))
  const span = daysBetween(first, range.to) + 1
  const size = bucketSize(span)

  const buckets: Bucket[] = []
  // Buckets are laid out backwards from the range's end so the final column is
  // always the current day or week — a partial bucket belongs at the recent
  // edge, where it reads as "so far", not at the start where it looks like a
  // slow period.
  for (let end = range.to; end >= first; end = addDays(end, -size)) {
    const start = maxIso(addDays(end, -(size - 1)), first)
    let amount = 0
    let sheets = 0
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const day = byDate.get(d)
      if (day) {
        amount += day.amount
        sheets += day.sheets
      }
    }
    buckets.push({ start, end, amount, sheets })
  }

  return buckets.reverse()
}

function bucketSize(spanDays: number): number {
  if (spanDays <= 31) return 1 // daily
  if (spanDays <= 182) return 7 // weekly
  return 30 // roughly monthly — even columns matter more than calendar months
}

export function daysBetween(from: string, to: string): number {
  const a = parseIsoDate(from)
  const b = parseIsoDate(to)
  if (!a || !b) return 0
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function maxIso(a: string, b: string): string {
  return a > b ? a : b
}

function minIso(a: string, b: string): string {
  return a < b ? a : b
}
