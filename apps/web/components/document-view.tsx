"use client"

import { useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  Image01Icon,
  PrinterIcon,
} from "@hugeicons/core-free-icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"

import { exportAsImage, exportAsPdf } from "@/lib/export"
import { fa } from "@/lib/fa"

// One toolbar for all four document types: print, the two exports, edit and
// delete. The sheet itself is passed in as children so this stays unaware of
// which document it is showing.
export function DocumentView({
  filename,
  editHref,
  onDelete,
  children,
}: {
  filename: string
  editHref: string
  onDelete: () => Promise<void>
  children: ReactNode
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const runExport = async (fn: (node: HTMLElement, name: string) => Promise<void>) => {
    if (!sheetRef.current) return
    setBusy(true)
    try {
      await fn(sheetRef.current, filename)
    } catch {
      toast.error(fa.common.exportFailed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <HugeiconsIcon icon={PrinterIcon} />
          {fa.actions.print}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => runExport(exportAsImage)}
        >
          <HugeiconsIcon icon={Image01Icon} />
          {fa.actions.exportImage}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => runExport(exportAsPdf)}
        >
          <HugeiconsIcon icon={Download01Icon} />
          {fa.actions.exportPdf}
        </Button>

        <div className="ms-auto flex items-center gap-2">
          <Button size="sm" render={<Link href={editHref} />} nativeButton={false}>
            <HugeiconsIcon icon={Edit02Icon} />
            {fa.actions.edit}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
              <HugeiconsIcon icon={Delete02Icon} />
              {fa.actions.delete}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{fa.actions.deleteConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {fa.actions.deleteConfirmBody}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{fa.actions.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={async () => {
                    await onDelete()
                    toast.success(fa.common.deleted)
                    router.refresh()
                  }}
                >
                  {fa.actions.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* The sheet is fixed-width; on a narrow screen it scrolls rather than
          reflowing, so what is exported matches what is shown. */}
      <div className="overflow-x-auto">
        <div ref={sheetRef} className="mx-auto w-fit shadow-sm print:shadow-none">
          {children}
        </div>
      </div>
    </div>
  )
}
