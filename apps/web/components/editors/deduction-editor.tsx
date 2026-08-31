"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"

import {
  deductionTotals,
  formatAmount,
  formatMoney,
  formatTotalWeight,
  manLineAmount,
  parseNumber,
  pricePerKg,
  pricePerManFromKg,
  snapPriceInput,
} from "@/lib/calc"
import { DatePicker } from "@/components/date-picker"
import { fa } from "@/lib/fa"
import { insertAt, moveRow, removeAt, replaceAt } from "@/lib/rows"
import type { CatalogItem, ManReceipt, PriceList } from "@/lib/types"

import {
  EditorComputed,
  EditorHead,
  EditorRow,
  EditorTable,
} from "./editor-table"
import { EditorShell } from "./editor-shell"
import { ItemNameInput } from "./item-name-input"
import { NumberInput } from "./number-input"
import { RowActions } from "./row-actions"
import { useUnsavedGuard } from "./use-unsaved-guard"

// فیش مزاد and فیش من are the same document with a different way of pricing a
// line: one quotes a price outright, the other a rate per من against a weight.
// Everything else — حق, هزینه‌ها, the totals stack — is identical, so they
// share this editor rather than the two 700-line near-copies they used to be.

export type DeductionKind = "PRICE" | "MAN"

type DraftItem = {
  key: string
  name: string
  /** فیش مزاد: the line price. */
  price: string
  /** فیش من: kilos bought. */
  weight: string
  /** فیش من: rate typed per kilo, stored and printed per من. */
  ratePerKg: string
}

type DraftExpense = { key: string; label: string; amount: string }

const newKey = () => Math.random().toString(36).slice(2)

const emptyItem = (): DraftItem => ({
  key: newKey(),
  name: "",
  price: "",
  weight: "",
  ratePerKg: "",
})

const emptyExpense = (): DraftExpense => ({ key: newKey(), label: "", amount: "" })

export function DeductionEditor({
  kind,
  document,
  catalog,
  onSave,
}: {
  kind: DeductionKind
  document: PriceList | ManReceipt | null
  catalog: CatalogItem[]
  onSave: (input: {
    title: string
    date: string
    basketCount: string
    commission: string
    commissionIsPercent: boolean
    notes: string
    items: { name: string; price?: number; weight?: number; pricePerMan?: number }[]
    expenses: { label: string; amount: number }[]
  }) => Promise<{ id?: string; error?: string }>
}) {
  const router = useRouter()
  const isMan = kind === "MAN"

  const [title, setTitle] = useState(document?.title ?? "")
  const [date, setDate] = useState(document?.date ?? today())
  const [basketCount, setBasketCount] = useState(
    document?.basketCount != null ? String(document.basketCount) : ""
  )
  const [commission, setCommission] = useState(
    document?.commission != null ? String(document.commission) : ""
  )
  const [commissionIsPercent, setCommissionIsPercent] = useState(
    document?.commissionIsPercent ?? false
  )
  const [notes, setNotes] = useState(document?.notes ?? "")

  const [items, setItems] = useState<DraftItem[]>(() => {
    if (!document) return [emptyItem()]
    if (isMan) {
      const doc = document as ManReceipt
      if (doc.items.length === 0) return [emptyItem()]
      return doc.items.map((i) => ({
        key: newKey(),
        name: i.name,
        price: "",
        weight: String(i.weight),
        // Rates are stored per من but typed per kilo.
        ratePerKg: String(pricePerKg(i.pricePerMan)),
      }))
    }
    const doc = document as PriceList
    if (doc.items.length === 0) return [emptyItem()]
    return doc.items.map((i) => ({
      key: newKey(),
      name: i.name,
      price: String(i.price),
      weight: "",
      ratePerKg: "",
    }))
  })

  const [expenses, setExpenses] = useState<DraftExpense[]>(
    () =>
      document?.expenses.map((e) => ({
        key: newKey(),
        label: e.label,
        amount: String(e.amount),
      })) ?? []
  )

  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  useUnsavedGuard(dirty && !saving)

  const touch = () => setDirty(true)

  // Totals recompute from the drafts on every keystroke, so the sticky bar is
  // always showing what would be saved right now.
  const lineAmounts = items.map((i) =>
    isMan
      ? manLineAmount({
          weight: parseNumber(i.weight),
          pricePerMan: pricePerManFromKg(parseNumber(i.ratePerKg)),
        })
      : parseNumber(i.price)
  )

  const totals = deductionTotals({
    lineAmounts,
    commission: commission ? parseNumber(commission) : undefined,
    commissionIsPercent,
    expenses: expenses.map((e) => ({ amount: parseNumber(e.amount) })),
  })

  const totalWeight = items.reduce((s, i) => s + parseNumber(i.weight), 0)

  const updateItem = (index: number, patch: Partial<DraftItem>) => {
    setItems((rows) => replaceAt(rows, index, { ...rows[index]!, ...patch }))
    touch()
  }

  const appendItem = () => {
    setItems((rows) => [...rows, emptyItem()])
    touch()
  }

  const submit = async () => {
    setSaving(true)
    const result = await onSave({
      title,
      date,
      basketCount,
      commission,
      commissionIsPercent,
      notes,
      items: items.map((i) =>
        isMan
          ? {
              name: i.name,
              weight: parseNumber(i.weight),
              pricePerMan: pricePerManFromKg(parseNumber(i.ratePerKg)),
            }
          : { name: i.name, price: parseNumber(i.price) }
      ),
      expenses: expenses.map((e) => ({ label: e.label, amount: parseNumber(e.amount) })),
    })
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setDirty(false)
    toast.success(fa.common.saved)
    router.push(`${isMan ? "/manreceipts" : "/pricelists"}/${result.id}`)
  }

  const summary = [
    { label: fa.sheets.itemsCount, value: String(items.length) },
    ...(isMan
      ? [{ label: fa.sheets.totalWeight, value: formatTotalWeight(totalWeight) }]
      : []),
    { label: fa.sheets.subtotal, value: formatAmount(totals.subtotal) },
    { label: fa.sheets.commission, value: formatAmount(totals.commission) },
    { label: fa.sheets.expenses, value: formatAmount(totals.expenses) },
    { label: fa.sheets.grandTotal, value: formatMoney(totals.grandTotal), strong: true },
  ]

  return (
    <EditorShell
      title={editorTitle(kind, Boolean(document))}
      saving={saving}
      onSave={submit}
      summary={summary}
    >
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="title">{fa.editor.title}</Label>
            <Input
              id="title"
              value={title}
              placeholder={fa.editor.titlePlaceholder}
              onChange={(e) => {
                setTitle(e.target.value)
                touch()
              }}
            />
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

          <div className="grid gap-2">
            <Label htmlFor="basket">{fa.sheets.basketCount}</Label>
            <NumberInput
              id="basket"
              value={basketCount}
              onValueChange={(v) => {
                setBasketCount(v)
                touch()
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{fa.sheets.item}</CardTitle>
          <CardAction>
            <Button variant="outline" size="sm" onClick={appendItem}>
              <HugeiconsIcon icon={Add01Icon} />
              {fa.actions.addRow}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <EditorTable
            template={
              isMan
                ? "2rem minmax(10rem,1fr) 6rem 6rem 7rem 2.25rem"
                : "2rem minmax(12rem,1fr) 8rem 7rem 2.25rem"
            }
            minWidth={isMan ? 620 : 520}
            ids={items.map((i) => i.key)}
            onReorder={(from, to) => {
              setItems((r) => moveRow(r, from, to))
              touch()
            }}
          >
            <EditorHead
              labels={
                isMan
                  ? [
                      null,
                      fa.sheets.item,
                      fa.sheets.weightKg,
                      fa.sheets.pricePerKg,
                      { label: fa.sheets.amount, align: "end" as const },
                      null,
                    ]
                  : [
                      null,
                      fa.sheets.item,
                      fa.sheets.price,
                      { label: fa.sheets.amount, align: "end" as const },
                      null,
                    ]
              }
            />

            {items.map((item, index) => (
              <EditorRow
                key={item.key}
                id={item.key}
                index={index}
                empty={!item.name.trim()}
              >

                <ItemNameInput
                  value={item.name}
                  catalog={catalog}
                  onValueChange={(v) => updateItem(index, { name: v })}
                  onPick={(picked) =>
                    updateItem(index, {
                      name: picked.name,
                      // The من catalog remembers a per-من rate; the field is
                      // per kilo, so convert on the way in.
                      ...(isMan
                        ? { ratePerKg: String(pricePerKg(picked.price)) }
                        : { price: String(picked.price) }),
                    })
                  }
                  onEnter={appendItem}
                />

                {isMan ? (
                  <>
                    <NumberInput
                      value={item.weight}
                      aria-label={fa.sheets.weightKg}
                      onValueChange={(v) => updateItem(index, { weight: v })}
                    />
                    <NumberInput
                      value={item.ratePerKg}
                      aria-label={fa.sheets.pricePerKg}
                      onValueChange={(v) => updateItem(index, { ratePerKg: v })}
                    />
                  </>
                ) : (
                  <NumberInput
                    value={item.price}
                    aria-label={fa.sheets.price}
                    onValueChange={(v) => updateItem(index, { price: v })}
                    // Prices settle in multiples of five — snapped on blur so
                    // typing "57" isn't fought keystroke by keystroke.
                    onBlurValue={(v) => updateItem(index, { price: snapPriceInput(v) })}
                  />
                )}

                <EditorComputed value={formatAmount(lineAmounts[index] ?? 0)} />

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
          <CardTitle>{fa.sheets.commission}</CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <Switch
                id="isPercent"
                checked={commissionIsPercent}
                onCheckedChange={(checked) => {
                  setCommissionIsPercent(checked)
                  touch()
                }}
              />
              <Label htmlFor="isPercent" className="text-sm font-normal">
                {fa.editor.commissionAsPercent}
              </Label>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid w-40 gap-2">
              <Label htmlFor="commission">
                {commissionIsPercent
                  ? fa.editor.commissionPercent
                  : fa.editor.commissionFlat}
              </Label>
              <NumberInput
                id="commission"
                value={commission}
                onValueChange={(v) => {
                  setCommission(v)
                  touch()
                }}
              />
            </div>

            {/* What that input actually costs, once the percentage and the
                round-to-five have been applied. */}
            <p className="text-muted-foreground pb-2 text-sm">
              −<span dir="ltr">{formatAmount(totals.commission)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{fa.sheets.expenses}</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExpenses((r) => [...r, emptyExpense()])
                touch()
              }}
            >
              <HugeiconsIcon icon={Add01Icon} />
              {fa.editor.addExpense}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-muted-foreground text-sm">{fa.editor.noExpenses}</p>
          ) : (
            <EditorTable
              template="2rem minmax(10rem,1fr) 8rem 2.25rem"
              minWidth={400}
              ids={expenses.map((e) => e.key)}
              onReorder={(from, to) => {
                setExpenses((r) => moveRow(r, from, to))
                touch()
              }}
            >
              <EditorHead
                labels={[null, fa.editor.expenseLabel, fa.editor.expenseAmount, null]}
              />
              {expenses.map((expense, index) => (
                <EditorRow key={expense.key} id={expense.key} index={index}>
                  <Input
                    value={expense.label}
                    aria-label={fa.editor.expenseLabel}
                    onChange={(e) => {
                      setExpenses((r) =>
                        replaceAt(r, index, { ...r[index]!, label: e.target.value })
                      )
                      touch()
                    }}
                  />
                  <NumberInput
                    value={expense.amount}
                    aria-label={fa.editor.expenseAmount}
                    onValueChange={(v) => {
                      setExpenses((r) => replaceAt(r, index, { ...r[index]!, amount: v }))
                      touch()
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={fa.actions.remove}
                    onClick={() => {
                      setExpenses((r) => removeAt(r, index))
                      touch()
                    }}
                  >
                    <HugeiconsIcon icon={Delete02Icon} />
                  </Button>
                </EditorRow>
              ))}
            </EditorTable>
          )}
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

function editorTitle(kind: DeductionKind, editing: boolean): string {
  if (kind === "MAN") {
    return editing ? fa.editor.editManReceipt : fa.editor.newManReceipt
  }
  return editing ? fa.editor.editPriceList : fa.editor.newPriceList
}
