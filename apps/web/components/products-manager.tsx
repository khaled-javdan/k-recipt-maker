"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

import { deleteProduct, saveProduct } from "@/actions/reference"
import { formatUnitWeight, toLatinDigits } from "@/lib/calc"
import { fa } from "@/lib/fa"
import type { Product } from "@/lib/types"

// The colour is a physical marker on the crate, so the palette is a fixed set
// of distinguishable colours rather than a free picker — though the hex field
// stays editable for anything unusual.
const SWATCHES = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#ec4899", "#78716c", "#111827", "#9ca3af",
]

export function ProductsManager({ products }: { products: Product[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Product | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [color, setColor] = useState("#ef4444")

  const openNew = () => {
    setEditing(null)
    setColor("#ef4444")
    setOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setColor(product.colorHex)
    setOpen(true)
  }

  const submit = async (formData: FormData) => {
    formData.set("colorHex", color)
    formData.set("unitWeight", toLatinDigits(String(formData.get("unitWeight") ?? "")))
    setSaving(true)
    const result = await saveProduct(editing?.id ?? null, formData)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setOpen(false)
    toast.success(fa.common.saved)
    router.refresh()
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{fa.products.title}</h1>
        <Button onClick={openNew}>
          <HugeiconsIcon icon={Add01Icon} />
          {fa.products.new}
        </Button>
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center">
          {fa.products.empty}
        </p>
      ) : (
        <ul className="grid gap-2">
          {products.map((product) => (
            <li key={product.id} className="flex items-center gap-3 rounded-lg border p-3">
              <span
                aria-hidden
                className="size-4 shrink-0 rounded-full border"
                style={{ background: product.colorHex }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{product.name}</div>
                <div className="text-muted-foreground truncate text-sm">
                  {product.colorName}
                  {product.colorName ? " · " : ""}
                  <span dir="ltr">{formatUnitWeight(product.unitWeight)} kg</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={fa.actions.edit}
                onClick={() => openEdit(product)}
              >
                <HugeiconsIcon icon={Edit02Icon} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={fa.actions.delete}
                onClick={async () => {
                  await deleteProduct(product.id)
                  toast.success(fa.common.deleted)
                  router.refresh()
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? fa.products.edit : fa.products.new}</DialogTitle>
          </DialogHeader>

          <form action={submit} key={editing?.id ?? "new"} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{fa.common.name}</Label>
              <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="colorName">{fa.products.colorName}</Label>
              <Input
                id="colorName"
                name="colorName"
                defaultValue={editing?.colorName ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label>{fa.products.colorHex}</Label>
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={swatch}
                    aria-pressed={color === swatch}
                    onClick={() => setColor(swatch)}
                    style={{ background: swatch }}
                    className={cn(
                      "size-7 rounded-full border transition",
                      color === swatch && "ring-ring ring-2 ring-offset-2"
                    )}
                  />
                ))}
              </div>
              <Input
                value={color}
                dir="ltr"
                onChange={(e) => setColor(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unitWeight">{fa.products.unitWeight}</Label>
              <Input
                id="unitWeight"
                name="unitWeight"
                dir="ltr"
                inputMode="decimal"
                defaultValue={editing ? String(editing.unitWeight) : ""}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? fa.editor.saving : fa.actions.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
