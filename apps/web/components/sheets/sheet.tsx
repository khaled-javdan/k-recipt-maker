import type { CSSProperties, ReactNode, Ref } from "react"

import { fa } from "@/lib/fa"

// Print primitives.
//
// Everything here is inline-styled on purpose. These nodes get rasterised by
// html2canvas for PNG and PDF export, and Tailwind's utility classes do not
// survive that reliably — computed styles do. The old app repeated this markup
// four times; here the four templates compose these instead.
//
// The measurements are the old app's, kept to the pixel: a 6px primary rule
// across the top, a 40px margin, a rounded bordered table with a primary-filled
// head, zebra rows starting grey, and a #f5f5f5 footer band. `primaryColor`
// draws the furniture and `accentColor` picks out the figures that matter.

/** Sheets render at a fixed width so exports are identical on every screen. */
export const SHEET_WIDTH = 760

// next/font sets --font-sans on <html>; naming the family literally would miss
// the generated face and silently fall back to system-ui for the whole sheet.
const FONT = 'var(--font-sans), "Vazirmatn", system-ui, sans-serif'

const MUTED = "#525252"
const LABEL = "#737373"
const HAIRLINE = "#e5e5e5"
const ROW_LINE = "#ececec"
const BAND = "#f5f5f5"
const BAND_LINE = "#d4d4d4"

export const labelStyle: CSSProperties = { fontSize: "12px", color: LABEL }

const numericStyle: CSSProperties = {
  textAlign: "end",
  fontVariantNumeric: "tabular-nums",
}

export function SheetFrame({
  ref,
  primaryColor,
  children,
}: {
  ref?: Ref<HTMLDivElement>
  primaryColor: string
  children: ReactNode
}) {
  return (
    <div
      ref={ref}
      dir="rtl"
      lang="fa"
      style={{
        fontFamily: FONT,
        borderTop: `6px solid ${primaryColor}`,
        padding: "40px",
        background: "#ffffff",
        color: "#171717",
        width: `${SHEET_WIDTH}px`,
        marginLeft: "auto",
        marginRight: "auto",
        boxSizing: "border-box",
        lineHeight: 1.4,
      }}
    >
      {children}
    </div>
  )
}

// ─── Header ────────────────────────────────────────────────────────────────

export type SheetIcon = "receipt" | "ledger" | "priceList" | "manReceipt"

// The old app's lucide glyphs, inlined. Four paths are cheaper than pulling an
// icon runtime into a subtree that exists to be rasterised, and it pins the
// artwork so a package bump cannot quietly redraw a printed sheet.
const ICON_PATHS: Record<SheetIcon, ReactNode> = {
  receipt: (
    <>
      <path d="M12 17V7" />
      <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" />
      <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
    </>
  ),
  ledger: (
    <>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </>
  ),
  priceList: (
    <>
      <path d="M15 12h-5" />
      <path d="M15 8h-5" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
    </>
  ),
  manReceipt: (
    <>
      <path d="M12 3v18" />
      <path d="m19 8 3 8a5 5 0 0 1-6 0zV7" />
      <path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" />
      <path d="m5 8 3 8a5 5 0 0 1-6 0zV7" />
      <path d="M7 21h10" />
    </>
  ),
}

/**
 * The masthead every sheet shares: identity on the right (RTL start), and the
 * sheet's own label, title and date on the left.
 *
 * `value` is the sheet's headline — a `#1000` on the receipt, the customer or
 * list name on the other three — and `subline` is the باسکت count, which the
 * deduction sheets hang under the company name.
 */
export function SheetHeader({
  companyName,
  logoUrl,
  icon,
  primaryColor,
  accentColor,
  label,
  value,
  valueWeight = 700,
  tabularValue = false,
  date,
  subline,
}: {
  companyName: string
  logoUrl?: string | null
  icon: SheetIcon
  primaryColor: string
  accentColor: string
  label: string
  value: string
  valueWeight?: number
  /** فیش prints a number here and lines its digits up; the rest print a name. */
  tabularValue?: boolean
  date: string
  subline?: string | null
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "24px",
        paddingBottom: "20px",
        borderBottom: `1px solid ${HAIRLINE}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: "56px",
              height: "56px",
              objectFit: "contain",
              borderRadius: "6px",
            }}
          />
        ) : (
          <div
            style={{
              width: "56px",
              height: "56px",
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
              borderRadius: "6px",
              background: primaryColor,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "28px", height: "28px" }}
            >
              {ICON_PATHS[icon]}
            </svg>
          </div>
        )}
        {subline ? (
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.2 }}>
              {companyName || fa.appName}
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "14px",
                fontWeight: 600,
                color: accentColor,
              }}
            >
              {subline}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.2 }}>
            {companyName || fa.appName}
          </div>
        )}
      </div>

      {/* The sheet is RTL, so its own details sit flush left. */}
      <div style={{ textAlign: "left" }}>
        <div style={labelStyle}>{label}</div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: valueWeight,
            ...(tabularValue ? { fontVariantNumeric: "tabular-nums" as const } : null),
            color: accentColor,
          }}
        >
          {value}
        </div>
        <div style={{ marginTop: "4px", fontSize: "14px", color: MUTED }}>{date}</div>
      </div>
    </div>
  )
}

// ─── Dates ─────────────────────────────────────────────────────────────────
// Both formatters read the ISO parts with a regex rather than through Date,
// because `new Date("2026-08-31")` is UTC midnight and shifts a day backwards
// for anyone west of Greenwich.

/** dd/mm/yyyy — what the deduction sheets and the app's lists print. */
export function formatSheetDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

/** d/m/yyyy, unpadded — the compact form the حساب rows carry. */
export function formatShortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${Number(m[3])}/${Number(m[2])}/${m[1]}` : iso
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/** "August 31, 2026" — the long form فیش and حساب have always printed. */
export function formatLongDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  const month = MONTHS[Number(m[2]) - 1]
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : iso
}

// ─── Table ─────────────────────────────────────────────────────────────────

export type SheetColumn<T> = {
  key: string
  label: string
  align?: "start" | "end"
  /** Right-aligns and holds digits to a single width. */
  numeric?: boolean
  /** The identifying column of each row, set slightly heavier. */
  strong?: boolean
  cellStyle?: CSSProperties
  render: (row: T, index: number) => ReactNode
}

/**
 * The bordered, rounded table the sheets print. `cellPadding` is the one thing
 * that varies between them: the two wide sheets breathe at 12px/20px, the
 * denser من and مزاد tables tighten up.
 */
export function SheetTable<T>({
  columns,
  rows,
  primaryColor,
  fontSize = "14px",
  cellPadding = "12px 20px",
  marginTop = "28px",
  tightNumerics = false,
  rowKey,
  footer,
}: {
  columns: SheetColumn<T>[]
  rows: T[]
  primaryColor: string
  fontSize?: string
  cellPadding?: string
  marginTop?: string
  /**
   * Extends the numeric treatment to the headers and stops figures breaking
   * mid-number. The من table needs it — five columns in 760px leaves its
   * amounts a column narrow enough to wrap — the two wide sheets do not.
   */
  tightNumerics?: boolean
  rowKey?: (row: T, index: number) => string
  footer?: ReactNode
}) {
  return (
    <table
      style={{
        marginTop,
        width: "100%",
        fontSize,
        borderCollapse: "separate",
        borderSpacing: 0,
        borderRadius: "8px",
        overflow: "hidden",
        border: `1px solid ${HAIRLINE}`,
      }}
    >
      <thead>
        <tr style={{ background: primaryColor, color: "#ffffff" }}>
          {columns.map((c) => (
            <th
              key={c.key}
              style={{
                padding: cellPadding,
                textAlign: c.numeric ? "end" : (c.align ?? "start"),
                fontWeight: 600,
                ...(c.numeric && tightNumerics
                  ? { fontVariantNumeric: "tabular-nums" as const, whiteSpace: "nowrap" as const }
                  : null),
              }}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => {
          // Zebra starts on grey: the first row is #fafafa, as in the old app.
          const cellStyle: CSSProperties = {
            padding: cellPadding,
            background: idx % 2 === 0 ? "#fafafa" : "#ffffff",
            borderBottom: `1px solid ${ROW_LINE}`,
          }
          return (
            <tr key={rowKey ? rowKey(row, idx) : idx}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{
                    ...cellStyle,
                    ...(c.numeric ? numericStyle : null),
                    ...(c.numeric && tightNumerics ? { whiteSpace: "nowrap" as const } : null),
                    ...(c.align && !c.numeric ? { textAlign: c.align } : null),
                    ...(c.strong ? { fontWeight: 500 } : null),
                    ...c.cellStyle,
                  }}
                >
                  {c.render(row, idx)}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
      {footer ? <tfoot>{footer}</tfoot> : null}
    </table>
  )
}

/** The grey band under the table. `accentColor` marks the figures that count. */
export function footerCell(
  options: {
    numeric?: boolean
    nowrap?: boolean
    accentColor?: string
    fontWeight?: number
    padding?: string
  } = {}
): CSSProperties {
  const { numeric, nowrap, accentColor, fontWeight, padding = "14px 20px" } = options
  return {
    padding,
    background: BAND,
    borderTop: `1px solid ${BAND_LINE}`,
    ...(numeric ? numericStyle : null),
    ...(nowrap ? { whiteSpace: "nowrap" } : null),
    ...(fontWeight ? { fontWeight } : null),
    ...(accentColor ? { color: accentColor } : null),
  }
}

// ─── Notes ─────────────────────────────────────────────────────────────────

export function SheetNotes({ notes }: { notes?: string | null }) {
  if (!notes) return null
  return (
    <div style={{ marginTop: "24px" }}>
      <div style={labelStyle}>{fa.common.notes}</div>
      <p
        style={{
          marginTop: "4px",
          fontSize: "14px",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        {notes}
      </p>
    </div>
  )
}
