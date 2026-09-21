"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"

import { BackLink } from "@/components/back-link"
import { useT } from "@/components/i18n-provider"

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
  backHref,
  dirty,
  saving,
  onSave,
  summary,
  children,
}: {
  title: string
  backHref: string
  /** Unsaved edits: leaving through the back link asks first. */
  dirty: boolean
  saving: boolean
  onSave: () => void
  summary: EditorSummaryItem[]
  children: ReactNode
}) {
  const t = useT()
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-4 flex items-center gap-2 print:hidden">
        <BackLink
          href={backHref}
          onClick={(e) => {
            if (!dirty) return
            e.preventDefault()
            setLeaving(true)
          }}
        />
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      <AlertDialog open={leaving} onOpenChange={setLeaving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.editor.unsavedTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.editor.unsavedBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.editor.stay}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => router.push(backHref)}>
              {t.editor.discard}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              {saving ? t.editor.saving : t.actions.save}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
