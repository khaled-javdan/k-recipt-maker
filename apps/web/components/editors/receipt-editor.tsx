"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"

import { saveReceipt } from "@/actions/documents"
import { formatTotalWeight, formatUnitWeight, parseNumber } from "@/lib/calc"
import { DatePicker } from "@/components/date-picker"
import { fa } from "@/lib/fa"
import { insertAt, moveRow, removeAt, replaceAt } from "@/lib/rows"
import type { Client, Product, Receipt } from "@/lib/types"

import {
  EditorComputed,
  EditorHead,
  EditorRow,
  EditorTable,
} from "./editor-table"
import { EditorShell } from "./editor-shell"
import { NumberInput } from "./number-input"
import { RowActions } from "./row-actions"
import { useUnsavedGuard } from "./use-unsaved-guard"

// فیش — what left the floor, by count and weight. No money anywhere on it.

type DraftItem = {
  key: string
  productId: string | null
  productName: string
  colorName: string
  colorHex: string
  unitWeight: string
  quantity: string
}

const newKey = () => Math.random().toString(36).slice(2)

const emptyItem = (): DraftItem => ({
  key: newKey(),
  productId: null,
  productName: "",
  colorName: "",
  colorHex: "#9ca3af",
  unitWeight: "",
  quantity: "",
})

const NO_CLIENT = "__none__"

export function ReceiptEditor({
  receipt,
  clients,
  products,
}: {
  receipt: Receipt | null
  clients: Client[]
  products: Product[]
}) {
  const router = useRouter()

  const [clientId, setClientId] = useState(receipt?.clientId ?? NO_CLIENT)
  const [date, setDate] = useState(receipt?.date ?? today())
  const [notes, setNotes] = useState(receipt?.notes ?? "")
  const [items, setItems] = useState<DraftItem[]>(() =>
    receipt && receipt.items.length > 0
      ? receipt.items.map((i) => ({
          key: newKey(),
          productId: i.productId,
          productName: i.productName,
          colorName: i.colorName,
          colorHex: i.colorHex,
          unitWeight: String(i.unitWeight),
          quantity: String(i.quantity),
        }))
      : [emptyItem()]
  )

  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  useUnsavedGuard(dirty && !saving)

  const touch = () => setDirty(true)

  // A line's weight is its count times the unit weight — derived, never typed,
  // so the two can never disagree on a printed sheet.
  const lineWeight = (item: DraftItem) =>
    parseNumber(item.quantity) * parseNumber(item.unitWeight)

  const totalCount = items.reduce((s, i) => s + parseNumber(i.quantity), 0)
  const totalWeight = items.reduce((s, i) => s + lineWeight(i), 0)

  const updateItem = (index: number, patch: Partial<DraftItem>) => {
    setItems((rows) => replaceAt(rows, index, { ...rows[index]!, ...patch }))
    touch()
  }

  const pickProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    // Product details are copied onto the line, not referenced: editing the
    // product later must not change an already-issued receipt.
    updateItem(index, {
      productId: product.id,
      productName: product.name,
      colorName: product.colorName,
      colorHex: product.colorHex,
      unitWeight: String(product.unitWeight),
    })
  }

  const submit = async () => {
    setSaving(true)
    const client = clients.find((c) => c.id === clientId)
    const result = await saveReceipt(receipt?.id ?? null, {
      clientId: clientId === NO_CLIENT ? null : clientId,
      clientName: client?.name ?? null,
      date,
      notes,
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        colorName: i.colorName,
        colorHex: i.colorHex,
        unitWeight: parseNumber(i.unitWeight),
        quantity: parseNumber(i.quantity),
        weight: lineWeight(i),
      })),
    })
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    setDirty(false)
    toast.success(fa.common.saved)
    router.push(`/receipts/${result.id}`)
  }

  return (
    <EditorShell
      title={receipt ? fa.editor.editReceipt : fa.editor.newReceipt}
      saving={saving}
      onSave={submit}
      summary={[
        { label: fa.sheets.itemsCount, value: String(items.length) },
        { label: fa.sheets.count, value: String(totalCount) },
        {
          label: fa.sheets.totalWeight,
          value: formatTotalWeight(totalWeight),
          strong: true,
        },
      ]}
    >
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>{fa.sheets.client}</Label>
            <Select
              value={clientId}
              onValueChange={(v) => {
                setClientId(v ?? NO_CLIENT)
                touch()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={fa.editor.selectClient} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLIENT}>{fa.editor.noClient}</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">{fa.common.date}</Label>
            <DatePicker
              id="date"
              value={date}
              onValueChange={(v) => {
                setDate(v)
                touch()
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{fa.sheets.product}</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setItems((r) => [...r, emptyItem()])
                touch()
              }}
            >
              <HugeiconsIcon icon={Add01Icon} />
              {fa.actions.addRow}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3">
          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm">{fa.editor.noProducts}</p>
          ) : null}

          <EditorTable
            template="2rem minmax(10rem,1fr) 5.5rem 7rem 7rem 2.25rem"
            minWidth={600}
            ids={items.map((i) => i.key)}
            onReorder={(from, to) => {
              setItems((r) => moveRow(r, from, to))
              touch()
            }}
          >
            <EditorHead
              labels={[
                null,
                fa.sheets.product,
                fa.sheets.count,
                fa.sheets.unitWeight,
                { label: fa.sheets.totalWeight, align: "end" as const },
                null,
              ]}
            />

            {items.map((item, index) => (
              <EditorRow
                key={item.key}
                id={item.key}
                index={index}
                empty={!item.productName.trim()}
              >

                <Select
                  value={item.productId ?? ""}
                  onValueChange={(v) => pickProduct(index, v ?? "")}
                >
                  <SelectTrigger aria-label={fa.sheets.product}>
                    <SelectValue placeholder={fa.editor.selectProduct}>
                      {item.productName || undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.colorName ? ` — ${p.colorName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <NumberInput
                  value={item.quantity}
                  aria-label={fa.sheets.count}
                  onValueChange={(v) => updateItem(index, { quantity: v })}
                />
                <NumberInput
                  value={item.unitWeight}
                  aria-label={fa.sheets.unitWeight}
                  onValueChange={(v) => updateItem(index, { unitWeight: v })}
                />

                <EditorComputed value={formatTotalWeight(lineWeight(item))} />

                <RowActions
                  index={index}
                  rowCount={items.length}
                  onInsertAbove={() => {
                    setItems((r) => insertAt(r, index, emptyItem()))
                    touch()
                  }}
                  onInsertBelow={() => {
                    setItems((r) => insertAt(r, index + 1, emptyItem()))
                    touch()
                  }}
                  onDuplicate={() => {
                    setItems((r) => insertAt(r, index + 1, { ...r[index]!, key: newKey() }))
                    touch()
                  }}
                  onMoveUp={() => {
                    setItems((r) => moveRow(r, index, index - 1))
                    touch()
                  }}
                  onMoveDown={() => {
                    setItems((r) => moveRow(r, index, index + 1))
                    touch()
                  }}
                  onRemove={() => {
                    setItems((r) => removeAt(r, index))
                    touch()
                  }}
                />
              </EditorRow>
            ))}
          </EditorTable>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{fa.common.notes}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            rows={3}
            onChange={(e) => {
              setNotes(e.target.value)
              touch()
            }}
          />
        </CardContent>
      </Card>
    </EditorShell>
  )
}

function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
