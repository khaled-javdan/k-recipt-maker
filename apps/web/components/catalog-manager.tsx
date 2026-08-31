"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, Edit02Icon, Search01Icon } from "@hugeicons/core-free-icons"
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

import { deleteCatalogItem, saveCatalogItem } from "@/actions/reference"
import { catalogKey } from "@/lib/catalog-key"
import { formatAmount, parseNumber, toLatinDigits } from "@/lib/calc"
import { fa } from "@/lib/fa"
import type { CatalogItem, CatalogKind } from "@/lib/types"

// One screen serves both catalogs. They never mix: the auction one remembers a
// line price, the من one a rate per من, so each has its own kind.
export function CatalogManager({
  kind,
  items,
}: {
  kind: CatalogKind
  items: CatalogItem[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = catalogKey(query)
    if (!q) return items
    return items.filter((i) => catalogKey(i.name).includes(q))
  }, [items, query])

  const submit = async (formData: FormData) => {
    const name = String(formData.get("name") ?? "")
    const price = parseNumber(toLatinDigits(String(formData.get("price") ?? "")))
    setSaving(true)
    const result = await saveCatalogItem(kind, editing?.id ?? null, name, price)
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
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          {kind === "PRICE" ? fa.catalog.priceTitle : fa.catalog.manTitle}
        </h1>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <HugeiconsIcon icon={Add01Icon} />
          {fa.catalog.new}
        </Button>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">{fa.catalog.description}</p>

      <div className="relative mb-4 max-w-sm">
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

      {filtered.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center">
          {items.length === 0 ? fa.catalog.empty : fa.common.noSearchResults}
        </p>
      ) : (
        <ul className="grid gap-2">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
              <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
              <span className="tabular-nums" dir="ltr">
                {formatAmount(item.price)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={fa.actions.edit}
                onClick={() => {
                  setEditing(item)
                  setOpen(true)
                }}
              >
                <HugeiconsIcon icon={Edit02Icon} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={fa.actions.delete}
                onClick={async () => {
                  await deleteCatalogItem(kind, item.id)
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
            <DialogTitle>{editing ? fa.catalog.edit : fa.catalog.new}</DialogTitle>
          </DialogHeader>
          <form action={submit} key={editing?.id ?? "new"} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{fa.common.name}</Label>
              <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">
                {kind === "MAN" ? fa.sheets.pricePerMan : fa.sheets.price}
              </Label>
              <Input
                id="price"
                name="price"
                dir="ltr"
                inputMode="decimal"
                defaultValue={editing ? String(editing.price) : ""}
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
