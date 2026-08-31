"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, ArrowLeft01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { toLatinDigits } from "@/lib/calc"
import { fa } from "@/lib/fa"
import { formatSheetDate } from "./sheets/sheet"

export type DocumentRow = {
  id: string
  number: number
  title: string
  date: string
  /** Short facts shown under the title — counts, weights, client name. */
  meta: string[]
  /** The figure this document is about, shown as the row's trailing value. */
  amount?: string
}

// The old app rendered four near-identical card lists with no way to find
// anything. This is one list, with search, shared by all four document types.
export function DocumentList({
  rows,
  basePath,
  newLabel,
}: {
  rows: DocumentRow[]
  basePath: string
  newLabel: string
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    // Searching "۱۰۰۴" should find document 1004, so the query is normalised
    // the same way every numeric input in the app is.
    const q = toLatinDigits(query).trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        String(r.number).includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.meta.some((m) => m.toLowerCase().includes(q)) ||
        (r.amount?.toLowerCase().includes(q) ?? false)
    )
  }, [rows, query])

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fa.actions.search}
            className="ps-9"
            aria-label={fa.actions.search}
          />
        </div>

        <Button
          render={<Link href={`${basePath}/new`} />}
          nativeButton={false}
          className="ms-auto"
        >
          <HugeiconsIcon icon={Add01Icon} />
          {newLabel}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center">
          <p>{rows.length === 0 ? fa.common.empty : fa.common.noSearchResults}</p>
          {rows.length === 0 ? (
            <p className="mt-1 text-sm">{fa.common.emptyHint}</p>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-2">
          {filtered.map((row) => (
            <li key={row.id}>
              <Link
                href={`${basePath}/${row.id}`}
                className="hover:bg-accent/50 focus-visible:ring-ring flex items-center gap-3 rounded-lg border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <Badge variant="secondary" dir="ltr" className="shrink-0 tabular-nums">
                  #{row.number}
                </Badge>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{row.title}</div>
                  {row.meta.length > 0 ? (
                    <div className="text-muted-foreground truncate text-sm">
                      {row.meta.join(" · ")}
                    </div>
                  ) : null}
                </div>

                {/* The figure and the date travel together at the row's end, so
                    a wide screen doesn't strand the date on its own. */}
                <div className="shrink-0 text-end">
                  {row.amount ? (
                    <div className="font-medium tabular-nums" dir="ltr">
                      {row.amount}
                    </div>
                  ) : null}
                  <div className="text-muted-foreground text-sm tabular-nums" dir="ltr">
                    {formatSheetDate(row.date)}
                  </div>
                </div>

                {/* Forward in an RTL page is leftward, so this points left as
                    drawn — rotating it would aim it back at the list. */}
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  className="text-muted-foreground/50 size-4 shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
