"use client"

import type { ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"

import { fa } from "@/lib/fa"

export type EditorSummaryItem = {
  label: string
  value: string
  /** The one figure that matters — the sheet's bottom line. */
  strong?: boolean
}

// Common chrome for every editor: the title, a sticky summary bar, and save.
//
// The bar is the real addition over the old app, where on a long sheet the
// grand total sat off-screen exactly when it mattered. It is sticky inside the
// content column rather than fixed to the viewport, so it spans the page
// without reaching under the sidebar.
export function EditorShell({
  title,
  saving,
  onSave,
  summary,
  children,
}: {
  title: string
  saving: boolean
  onSave: () => void
  summary: EditorSummaryItem[]
  children: ReactNode
}) {
  return (
    <div className="flex min-h-full flex-col">
      <h1 className="mb-4 text-xl font-semibold print:hidden">{title}</h1>

      <div className="grid gap-4">{children}</div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 md:-mx-6 print:hidden">
        <div className="bg-background/90 border-t backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 md:px-6">
            {summary.map((item) => (
              <div
                key={item.label}
                className={
                  item.strong
                    ? "order-last flex items-baseline gap-2 md:order-none"
                    : "flex items-baseline gap-2"
                }
              >
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {item.label}
                </span>
                <span
                  dir="ltr"
                  className={
                    item.strong
                      ? "text-base font-semibold tabular-nums"
                      : "text-sm tabular-nums"
                  }
                >
                  {item.value}
                </span>
              </div>
            ))}

            <Button onClick={onSave} disabled={saving} className="ms-auto">
              {saving ? fa.editor.saving : fa.actions.save}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
