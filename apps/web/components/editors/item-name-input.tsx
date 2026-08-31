"use client"

import { useId, useMemo, useRef, useState } from "react"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import { catalogKey } from "@/lib/catalog-key"
import type { CatalogItem } from "@/lib/types"

// Autocomplete for item names, backed by the catalog the app learns as sheets
// are saved. Picking a suggestion fills the price too, which is the whole
// point — the rate for a fish is remembered from last time.
//
// Deliberately not a Popover: this sits inside a spreadsheet-like grid where
// focus must stay in the input while the list is open, and Enter has to fall
// through to the row's own handler once a choice is made.
export function ItemNameInput({
  value,
  onValueChange,
  onPick,
  catalog,
  onEnter,
  className,
  ...props
}: {
  value: string
  onValueChange: (value: string) => void
  /** Fired when a suggestion is chosen, with its remembered price. */
  onPick: (item: CatalogItem) => void
  catalog: CatalogItem[]
  /** Enter with no suggestion highlighted — the editors append a row. */
  onEnter?: () => void
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const listId = useId()
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const matches = useMemo(() => {
    const q = catalogKey(value)
    if (!q) return []
    return catalog
      .filter((c) => catalogKey(c.name).includes(q))
      // An exact match is already typed; suggesting it back is noise.
      .filter((c) => catalogKey(c.name) !== q)
      .slice(0, 8)
  }, [catalog, value])

  const visible = open && matches.length > 0

  const choose = (item: CatalogItem) => {
    onPick(item)
    setOpen(false)
    setHighlight(0)
  }

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        role="combobox"
        aria-expanded={visible}
        aria-controls={visible ? listId : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        className={className}
        onChange={(e) => {
          onValueChange(e.target.value)
          setOpen(true)
          setHighlight(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Let a click on a suggestion land before the list unmounts.
          blurTimer.current = setTimeout(() => setOpen(false), 120)
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && visible) {
            e.preventDefault()
            setHighlight((h) => (h + 1) % matches.length)
          } else if (e.key === "ArrowUp" && visible) {
            e.preventDefault()
            setHighlight((h) => (h - 1 + matches.length) % matches.length)
          } else if (e.key === "Escape") {
            setOpen(false)
          } else if (e.key === "Enter") {
            const picked = visible ? matches[highlight] : undefined
            if (picked) {
              e.preventDefault()
              choose(picked)
            } else {
              onEnter?.()
            }
          }
        }}
      />

      {visible ? (
        <ul
          id={listId}
          role="listbox"
          className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border p-1 shadow-md"
        >
          {matches.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                // onMouseDown, not onClick: the input's blur would otherwise
                // close the list before the click ever lands.
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (blurTimer.current) clearTimeout(blurTimer.current)
                  choose(item)
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-start text-sm",
                  i === highlight && "bg-accent text-accent-foreground"
                )}
              >
                <span className="truncate">{item.name}</span>
                <span className="text-muted-foreground shrink-0 tabular-nums" dir="ltr">
                  {item.price}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
