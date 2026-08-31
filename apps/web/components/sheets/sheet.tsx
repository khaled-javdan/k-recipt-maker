import type { CSSProperties, ReactNode, Ref } from "react"

// Print primitives.
//
// Everything here is inline-styled on purpose. These nodes get rasterised by
// html2canvas for PNG and PDF export, and Tailwind's utility classes do not
// survive that reliably — computed styles do. The old app repeated this markup
// four times; here the four templates compose these instead.

/** Sheets render at a fixed width so exports are identical on every screen. */
export const SHEET_WIDTH = 760

const FONT = '"Vazirmatn", "Vazirmatn Variable", system-ui, sans-serif'

export const sheetText: CSSProperties = {
  fontFamily: FONT,
  color: "#111827",
  fontVariantNumeric: "tabular-nums",
}

export function SheetFrame({
  ref,
  accentColor,
  children,
}: {
  ref?: Ref<HTMLDivElement>
  accentColor: string
  children: ReactNode
}) {
  return (
    <div
      ref={ref}
      dir="rtl"
      lang="fa"
      style={{
        ...sheetText,
        width: SHEET_WIDTH,
        background: "#ffffff",
        borderTop: `6px solid ${accentColor}`,
        padding: "28px 32px 32px",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  )
}

export function SheetHeader({
  companyName,
  logoUrl,
  title,
  number,
  date,
  subtitle,
}: {
  companyName: string
  logoUrl?: string | null
  title: string
  number: number
  date: string
  subtitle?: string | null
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ height: 44, width: "auto", objectFit: "contain" }}
          />
        ) : null}
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{companyName}</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
        </div>
      </div>

      <div style={{ textAlign: "left", fontSize: 13, color: "#374151" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }} dir="ltr">
          #{number}
        </div>
        <div dir="ltr">{formatSheetDate(date)}</div>
        {subtitle ? <div style={{ marginTop: 2 }}>{subtitle}</div> : null}
      </div>
    </div>
  )
}

// Dates are stored as ISO yyyy-mm-dd and printed dd/mm/yyyy. Parsed by regex
// rather than through Date, because `new Date("2026-08-31")` is UTC midnight
// and shifts a day backwards for anyone west of Greenwich.
export function formatSheetDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

export type SheetColumn<T> = {
  key: string
  label: string
  align?: "start" | "end" | "center"
  width?: number | string
  render: (row: T, index: number) => ReactNode
}

export function SheetTable<T>({
  columns,
  rows,
  accentColor,
  footer,
}: {
  columns: SheetColumn<T>[]
  rows: T[]
  accentColor: string
  footer?: ReactNode
}) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
        tableLayout: "fixed",
      }}
    >
      <thead>
        <tr style={{ background: "#f3f4f6" }}>
          {columns.map((c) => (
            <th
              key={c.key}
              style={{
                textAlign: c.align ?? "start",
                padding: "8px 10px",
                borderBottom: `2px solid ${accentColor}`,
                fontWeight: 700,
                width: c.width,
                whiteSpace: "nowrap",
              }}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 ? "#fafafa" : "#ffffff" }}>
            {columns.map((c) => (
              <td
                key={c.key}
                style={{
                  textAlign: c.align ?? "start",
                  padding: "7px 10px",
                  borderBottom: "1px solid #e5e7eb",
                  wordBreak: "break-word",
                }}
              >
                {c.render(row, i)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer ? <tfoot>{footer}</tfoot> : null}
    </table>
  )
}

export function TotalsStack({
  rows,
  accentColor,
}: {
  rows: { label: string; value: string; strong?: boolean }[]
  accentColor: string
}) {
  return (
    <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-start" }}>
      <div style={{ minWidth: 260 }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              padding: "6px 10px",
              fontSize: r.strong ? 15 : 13,
              fontWeight: r.strong ? 700 : 400,
              borderTop: i === rows.length - 1 ? `2px solid ${accentColor}` : undefined,
            }}
          >
            <span>{r.label}</span>
            <span dir="ltr">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SheetNotes({ notes }: { notes?: string | null }) {
  if (!notes) return null
  return (
    <div
      style={{
        marginTop: 18,
        padding: "10px 12px",
        background: "#f9fafb",
        borderRadius: 6,
        fontSize: 12,
        color: "#374151",
        whiteSpace: "pre-wrap",
      }}
    >
      {notes}
    </div>
  )
}
