"use client"

import type { CSSProperties, ReactNode } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@workspace/ui/lib/utils"

import { fa } from "@/lib/fa"

// The editors are spreadsheets, not stacks of forms. Every row shares one grid
// template so columns line up down the page, the header is written once
// instead of on the first row, and the row stays a fixed shape — which is what
// stops the computed cell and the row menu from drifting apart.
//
// On a narrow screen the grid keeps its width and the table scrolls sideways,
// the way a spreadsheet does. Reflowing these columns into a stack would make
// a long sheet unreadable.

/** Sheets get built out of order, so rows can be dragged by their number. */
export function EditorTable({
  template,
  minWidth = 640,
  ids,
  onReorder,
  children,
}: {
  /** A grid-template-columns value, in logical (start → end) order. */
  template: string
  minWidth?: number
  /** Row ids in display order — enables drag reordering when provided. */
  ids?: string[]
  onReorder?: (from: number, to: number) => void
  children: ReactNode
}) {
  const sensors = useSensors(
    // A small threshold before a drag starts, so a tap on the row number on a
    // phone still behaves like a tap and the page can still be scrolled.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const grid = (
    <div
      style={{ minWidth, "--editor-cols": template } as CSSProperties}
      className="grid gap-y-1"
    >
      {children}
    </div>
  )

  return (
    <div className="overflow-x-auto">
      {ids && onReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          // Rows only ever move up and down, and never out of their table.
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={({ active, over }: DragEndEvent) => {
            if (!over || active.id === over.id) return
            const from = ids.indexOf(String(active.id))
            const to = ids.indexOf(String(over.id))
            if (from !== -1 && to !== -1) onReorder(from, to)
          }}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {grid}
          </SortableContext>
        </DndContext>
      ) : (
        grid
      )}
    </div>
  )
}

/**
 * A header cell. `null` is a deliberately empty column (row number, actions);
 * `end` right-aligns the label over a numeric column so it sits above the
 * digits rather than the far edge of the cell.
 */
export type EditorHeadLabel = string | null | { label: string; align: "end" }

export function EditorHead({ labels }: { labels: EditorHeadLabel[] }) {
  return (
    <div
      style={{ gridTemplateColumns: "var(--editor-cols)" }}
      className="text-muted-foreground grid items-end gap-2 px-1 pb-1 text-xs font-medium"
    >
      {labels.map((entry, i) => {
        const label = typeof entry === "string" ? entry : (entry?.label ?? null)
        const alignEnd = typeof entry === "object" && entry !== null
        // An empty column still renders its cell. `sr-only` would not do: it is
        // absolutely positioned, so it leaves the grid flow and shifts every
        // following header one column out of line with its input.
        return (
          <div key={i} className={cn("truncate", alignEnd && "text-end")}>
            {label}
          </div>
        )
      })}
    </div>
  )
}

export function EditorRow({
  id,
  index,
  /** A row with nothing typed in it yet — held back so filled rows read first. */
  empty,
  className,
  children,
}: {
  id: string
  index: number
  empty?: boolean
  className?: string
  children: ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        gridTemplateColumns: "var(--editor-cols)",
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        "grid items-center gap-2 rounded-md px-1 py-1",
        isDragging
          ? "bg-background relative z-10 shadow-lg ring-1 ring-border"
          : "hover:bg-muted/40 transition-colors",
        // Fades only until touched, so a sheet with ten spare rows still reads
        // as the three lines that actually have something on them.
        empty && !isDragging && "opacity-60 focus-within:opacity-100 hover:opacity-100",
        className
      )}
    >
      {/* The row number doubles as the drag handle — it is already the first
          cell, and giving it the job avoids spending a whole column on a grip.
          It stays a real button so the keyboard sensor can pick it up. */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`${fa.actions.dragRow} ${index + 1}`}
        title={fa.dragHintTitle}
        {...attributes}
        {...listeners}
        className={cn(
          "text-muted-foreground/60 hover:text-foreground hover:bg-muted focus-visible:ring-ring rounded text-xs tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-none",
          // Fills the cell rather than hugging the digits: a 16px-tall target
          // is not grabbable with a thumb, which is how this app is used.
          "flex h-8 w-full items-center justify-center",
          // touch-none is what lets a finger drag the row instead of scrolling
          // the page.
          "cursor-grab touch-none select-none active:cursor-grabbing"
        )}
      >
        <span dir="ltr">{index + 1}</span>
      </button>

      {children}
    </div>
  )
}

/** The row's derived figure — read-only, so it reads as output not input. */
export function EditorComputed({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  return (
    // The cell keeps the page direction so `text-end` lands on the same side
    // as its header; only the digits themselves are LTR. Putting dir="ltr" on
    // the cell would flip `text-end` and pull the figure to the far edge.
    <div
      className={cn(
        "text-muted-foreground truncate text-end text-sm tabular-nums",
        className
      )}
    >
      <span dir="ltr">{value}</span>
    </div>
  )
}
