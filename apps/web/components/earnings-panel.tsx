"use client"

import { useState } from "react"
import Link from "next/link"
import { faIR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import { formatAmount, formatMoney } from "@/lib/calc"
import {
  parseIsoDate,
  PRESET_KEYS,
  toIsoDate,
  type Bucket,
  type PresetKey,
  type RangeKey,
} from "@/lib/analytics"
import type { EarningRow } from "@/lib/data"
import { fa } from "@/lib/fa"
import { formatSheetDate } from "./sheets/sheet"

// The حق earned across a sheet type — فیش مزاد or فیش من — over a window the
// user picks. It sits above the sheet list rather than on a page of its own:
// the question "what did we make lately" is asked while looking at the sheets
// that answer it. Which list it is sitting on is `basePath`: every link the
// panel builds, and every row in the breakdown, stays on that page.
//
// Range and breakdown state both live in the URL, so the server re-queries on
// each change and a view survives a reload or a shared link. Nothing here
// fetches.

// The calendar's range shape. Declared here rather than imported so the web
// app does not take a direct dependency on react-day-picker for one type — the
// calendar is @workspace/ui's business.
// `from` is present but may be undefined: react-day-picker keeps the key while
// a range is half-selected.
type CalendarRange = { from: Date | undefined; to?: Date | undefined }

const PRESET_LABELS: Record<PresetKey, string> = {
  today: fa.earnings.rangeToday,
  week: fa.earnings.rangeWeek,
  month: fa.earnings.rangeMonth,
  quarter: fa.earnings.rangeQuarter,
  all: fa.earnings.rangeAll,
}

export type EarningsPanelProps = {
  /** The list this panel sits on: "/pricelists" or "/manreceipts". */
  basePath: string
  /** What is being summed, in words — the sheet type differs per list. */
  description: string
  /** Shown for a sheet saved without a title, per sheet type. */
  untitledLabel: string
  range: RangeKey
  from: string | null
  to: string
  total: number
  sheetCount: number
  average: number
  previousTotal: number | null
  buckets: Bucket[]
  /** Present only when the breakdown is open — it is a second query. */
  rows: EarningRow[] | null
}

/** Builds a panel URL, carrying the parts of the state that are not changing. */
function panelHref(
  next: { range?: RangeKey; from?: string; to?: string; details?: boolean },
  current: PanelState
) {
  const range = next.range ?? current.range
  const details = next.details ?? current.details
  const params = new URLSearchParams({ range })

  if (range === "custom") {
    params.set("from", next.from ?? current.from ?? current.to)
    params.set("to", next.to ?? current.to)
  }
  if (details) params.set("details", "1")

  return `${current.basePath}?${params.toString()}`
}

type PanelState = {
  basePath: string
  range: RangeKey
  from: string | null
  to: string
  details: boolean
}

export function EarningsPanel({
  basePath,
  description,
  untitledLabel,
  range,
  from,
  to,
  total,
  sheetCount,
  average,
  previousTotal,
  buckets,
  rows,
}: EarningsPanelProps) {
  const state: PanelState = { basePath, range, from, to, details: rows !== null }

  return (
    <section className="mb-6 rounded-xl border p-4 md:p-5 print:hidden">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{fa.earnings.title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RangeFilter state={state} />
          <RangePicker state={state} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-8">
        <div>
          {/* The one figure the panel exists to show. Proportional figures, not
              tabular — at this size tabular digits read loose and gappy. */}
          <div className="text-muted-foreground text-sm">{fa.earnings.total}</div>
          <div dir="ltr" className="mt-0.5 text-start text-4xl font-semibold">
            {formatMoney(total)}
          </div>
          <Delta total={total} previousTotal={previousTotal} />

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Stat label={fa.earnings.sheets} value={formatAmount(sheetCount)} />
            <Stat
              label={fa.earnings.average}
              value={formatMoney(Math.round(average))}
            />
          </dl>

          {sheetCount > 0 ? (
            <Link
              href={panelHref({ details: !state.details }, state)}
              scroll={false}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mt-3 inline-block rounded text-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
            >
              {state.details ? fa.earnings.hideDetails : fa.earnings.showDetails}
            </Link>
          ) : null}
        </div>

        <EarningsChart buckets={buckets} />
      </div>

      {rows ? (
        <Breakdown
          rows={rows}
          sheetCount={sheetCount}
          basePath={basePath}
          untitledLabel={untitledLabel}
        />
      ) : null}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd dir="ltr" className="text-start text-base font-medium tabular-nums">
        {value}
      </dd>
    </div>
  )
}

// Up is good: this is income. A period with nothing to compare against gets no
// delta rather than a "+100%" invented out of a zero baseline.
function Delta({
  total,
  previousTotal,
}: {
  total: number
  previousTotal: number | null
}) {
  if (previousTotal === null) return null

  // Nothing before and nothing now: the chart's empty state already says so,
  // and repeating it here just fills the space twice.
  if (previousTotal === 0) {
    if (total === 0) return null
    return (
      <p className="text-muted-foreground mt-1 text-xs">{fa.earnings.noPrevious}</p>
    )
  }

  // Whole percent. A second decimal on a comparison between two windows is
  // precision the figure does not have.
  const change = Math.round(((total - previousTotal) / previousTotal) * 100)
  const up = change >= 0

  return (
    <p className="mt-1 flex items-center gap-1 text-xs">
      <HugeiconsIcon
        icon={up ? ArrowUp01Icon : ArrowDown01Icon}
        className={cn(
          "size-3.5 shrink-0",
          up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
        )}
      />
      <span
        dir="ltr"
        className={cn(
          "font-medium tabular-nums",
          up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
        )}
      >
        {up ? "+" : "−"}
        {Math.abs(change)}%
      </span>
      <span className="text-muted-foreground">{fa.earnings.vsPrevious}</span>
    </p>
  )
}

function RangeFilter({ state }: { state: PanelState }) {
  return (
    <div
      role="group"
      aria-label={fa.earnings.rangeLabel}
      className="bg-muted/60 flex flex-wrap items-center gap-0.5 rounded-full p-0.5"
    >
      {PRESET_KEYS.map((key) => {
        const isActive = key === state.range
        return (
          <Link
            key={key}
            href={panelHref({ range: key }, state)}
            scroll={false}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "focus-visible:ring-ring rounded-full px-3 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
              isActive
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {PRESET_LABELS[key]}
          </Link>
        )
      })}
    </div>
  )
}

// A calendar range, for the questions the presets don't answer — one market
// week, a single past month, the stretch either side of a trip.
function RangePicker({ state }: { state: PanelState }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isCustom = state.range === "custom"

  const [draft, setDraft] = useState<CalendarRange | undefined>(() =>
    isCustom
      ? {
          from: parseIsoDate(state.from ?? "") ?? undefined,
          to: parseIsoDate(state.to) ?? undefined,
        }
      : undefined
  )

  // react-day-picker fills `from` on the first click and `to` on the second, so
  // a half-finished selection is a normal state, not an error — the button just
  // stays disabled until both ends exist.
  const complete = draft?.from && draft.to

  const apply = () => {
    if (!draft?.from || !draft.to) return
    setOpen(false)
    router.push(
      panelHref(
        {
          range: "custom",
          from: toIsoDate(draft.from),
          to: toIsoDate(draft.to),
        },
        state
      ),
      { scroll: false }
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={fa.earnings.pickRange}
        className={cn(
          "focus-visible:ring-ring flex h-8 items-center gap-2 rounded-full border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
          isCustom ? "bg-background font-medium" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <HugeiconsIcon icon={Calendar03Icon} className="size-4 shrink-0" />
        {isCustom && state.from ? (
          <span dir="ltr" className="tabular-nums">
            {formatSheetDate(state.from)} – {formatSheetDate(state.to)}
          </span>
        ) : (
          fa.earnings.rangeCustom
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={draft}
          defaultMonth={draft?.from}
          onSelect={setDraft}
          // Same locale as the app's other date picker, which is also what
          // startOfWeek() assumes: faIR starts the week on Saturday, and a
          // calendar that started it on Sunday would disagree with the
          // "این هفته" chip beside it.
          locale={faIR}
          dir="rtl"
          numberOfMonths={1}
          autoFocus
        />
        <div className="flex items-center justify-between gap-2 border-t p-2">
          <span dir="ltr" className="text-muted-foreground px-1 text-xs tabular-nums">
            {draft?.from ? formatSheetDate(toIsoDate(draft.from)) : "—"}
            {" – "}
            {draft?.to ? formatSheetDate(toIsoDate(draft.to)) : "—"}
          </span>
          <Button size="sm" onClick={apply} disabled={!complete}>
            {fa.earnings.apply}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// A column per bucket, one series, one hue — so no legend: the panel heading
// already says what is plotted. Only the peak is labelled; every other value
// is in the readout, because a number over every column goes unread.
//
// The plot runs left-to-right even though the page is RTL. Every figure in this
// app — dates, amounts, document numbers — is already forced to LTR, and a time
// axis running the other way to the dates printed under it reads as a bug.
function EarningsChart({ buckets }: { buckets: Bucket[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (buckets.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-40 items-center justify-center rounded-lg border border-dashed text-sm">
        {fa.earnings.empty}
      </div>
    )
  }

  const peak = Math.max(...buckets.map((b) => b.amount))
  const peakIndex = buckets.findIndex((b) => b.amount === peak)
  const shown = hovered === null ? buckets[peakIndex]! : buckets[hovered]!

  return (
    <figure className="m-0 flex min-w-0 flex-col">
      {/* The readout replaces a floating tooltip: it cannot collide with the
          columns, cannot overflow the panel, and works the same under a finger
          as under a pointer. It holds the peak's figures when nothing is
          hovered, so the space is never empty and never jumps in height. */}
      <figcaption className="mb-2 flex min-h-9 flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="text-muted-foreground" dir="ltr">
          {bucketLabel(shown)}
        </span>
        <span className="font-medium tabular-nums" dir="ltr">
          {formatMoney(shown.amount)}
        </span>
        <span className="text-muted-foreground text-xs">
          {fa.earnings.sheets}: {formatAmount(shown.sheets)}
        </span>
      </figcaption>

      <div
        dir="ltr"
        className="border-border flex h-40 items-end gap-0.5 border-b"
        onPointerLeave={() => setHovered(null)}
      >
        {buckets.map((bucket, i) => {
          const height = peak > 0 ? (bucket.amount / peak) * 100 : 0
          return (
            <button
              key={bucket.start}
              type="button"
              // The band fills its share of the width so the columns reach the
              // axis end-labels; the bar inside is what gets capped. The whole
              // band height is the hit target too — a quiet day's bar is a few
              // pixels tall and unhittable on its own.
              className="group focus-visible:ring-ring relative flex h-full min-w-1 flex-1 cursor-default items-end justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
              onPointerEnter={() => setHovered(i)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              aria-label={`${bucketLabel(bucket)} — ${formatMoney(bucket.amount)}`}
            >
              <span
                aria-hidden
                className={cn(
                  // Capped thickness, never filling the band — the leftover is
                  // deliberate air, not a gap to close.
                  "bg-primary w-full max-w-6 rounded-t-[4px] transition-opacity",
                  hovered !== null && hovered !== i && "opacity-40"
                )}
                style={{
                  // A day that earned something must not render as nothing, so
                  // a non-zero amount keeps a visible floor. A true zero stays
                  // blank — that is the honest mark for a day with no sheet.
                  height: bucket.amount > 0 ? `max(3px, ${height}%)` : 0,
                }}
              />
            </button>
          )
        })}
      </div>

      <div
        dir="ltr"
        className="text-muted-foreground mt-1.5 flex justify-between text-xs tabular-nums"
      >
        <span>{formatSheetDate(buckets[0]!.start)}</span>
        <span>{formatSheetDate(buckets[buckets.length - 1]!.end)}</span>
      </div>
    </figure>
  )
}

// Where the headline figure came from: one row per sheet, newest first, each
// linking to the sheet itself so a surprising number can be opened and checked.
function Breakdown({
  rows,
  sheetCount,
  basePath,
  untitledLabel,
}: {
  rows: EarningRow[]
  sheetCount: number
  basePath: string
  untitledLabel: string
}) {
  return (
    <div className="mt-5 border-t pt-4">
      <h3 className="mb-2 text-sm font-medium">{fa.earnings.breakdown}</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-start text-xs">
              <th className="py-1.5 pe-3 text-start font-normal whitespace-nowrap">
                {fa.common.number}
              </th>
              <th className="py-1.5 pe-3 text-start font-normal">
                {fa.earnings.who}
              </th>
              <th className="py-1.5 pe-3 text-start font-normal whitespace-nowrap">
                {fa.common.date}
              </th>
              <th className="py-1.5 text-end font-normal whitespace-nowrap">
                {fa.sheets.commission}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-accent/40 border-t">
                <td className="py-1.5 pe-3 whitespace-nowrap">
                  <Link
                    href={`${basePath}/${row.id}`}
                    className="text-muted-foreground inline-block tabular-nums underline-offset-4 hover:underline"
                  >
                    <span dir="ltr">#{row.number}</span>
                  </Link>
                </td>
                <td className="w-full max-w-0 truncate py-1.5 pe-3">
                  <Link
                    href={`${basePath}/${row.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {row.title || untitledLabel}
                  </Link>
                </td>
                <td className="py-1.5 pe-3 text-start tabular-nums whitespace-nowrap">
                  <span dir="ltr">{formatSheetDate(row.date)}</span>
                </td>
                <td className="py-1.5 text-end font-medium tabular-nums whitespace-nowrap">
                  <span dir="ltr">{formatMoney(row.commission)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length < sheetCount ? (
        <p className="text-muted-foreground mt-2 text-xs">
          {fa.earnings.rowsTruncated
            .replace("{shown}", formatAmount(rows.length))
            .replace("{total}", formatAmount(sheetCount))}
        </p>
      ) : null}
    </div>
  )
}

function bucketLabel(bucket: Bucket): string {
  return bucket.start === bucket.end
    ? formatSheetDate(bucket.start)
    : `${formatSheetDate(bucket.start)} – ${formatSheetDate(bucket.end)}`
}
