"use client"

import { useState } from "react"
import { faIR } from "date-fns/locale"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon } from "@hugeicons/core-free-icons"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import { fa } from "@/lib/fa"
import { formatSheetDate } from "./sheets/sheet"

// Dates are stored as ISO yyyy-mm-dd, the same shape the old <input type="date">
// produced, so nothing downstream (schemas, sheets, export) has to change.
//
// Both conversions below go through the local calendar deliberately.
// `new Date("2026-08-31")` parses as UTC midnight and reads back as the 30th
// for anyone west of Greenwich, and `toISOString()` has the mirror bug going
// the other way — the same trap formatSheetDate() documents.
function parseIsoDate(iso: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return undefined
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function DatePicker({
  id,
  value,
  onValueChange,
  className,
  disabled,
}: {
  id?: string
  /** ISO yyyy-mm-dd, or "" when unset. */
  value: string
  onValueChange: (value: string) => void
  className?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = parseIsoDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          // Matches the Input's shape so a date field still reads as a field.
          "flex h-9 w-full items-center gap-2 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-start text-base transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
      >
        <HugeiconsIcon
          icon={Calendar03Icon}
          className="text-muted-foreground pointer-events-none size-4 shrink-0"
        />
        <span
          dir="ltr"
          className={cn(
            "flex-1 text-start tabular-nums",
            !selected && "text-muted-foreground"
          )}
        >
          {selected ? formatSheetDate(value) : fa.common.pickDate}
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onValueChange(date ? toIsoDate(date) : "")
            setOpen(false)
          }}
          locale={faIR}
          dir="rtl"
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
