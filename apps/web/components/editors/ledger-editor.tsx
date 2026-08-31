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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

import { saveLedger } from "@/actions/documents"
import { formatAmount, ledgerBalances, parseNumber } from "@/lib/calc"
import { DatePicker } from "@/components/date-picker"
import { fa } from "@/lib/fa"
import { insertAt, moveRow, removeAt, replaceAt } from "@/lib/rows"
import type { Ledger } from "@/lib/types"

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

// حساب — the account sheet. مانده is cumulative down the page, so the editor
// shows the running figure per row exactly as the printed sheet will.

type DraftRow = {
  key: string
  name: string
  date: string
  invoice: string
  commission: string
  cash: string
}

const newKey = () => Math.random().toString(36).slice(2)

const emptyRow = (): DraftRow => ({
  key: newKey(),
  name: "",
  date: "",
  invoice: "",
  commission: "",
  cash: "",
})

export function LedgerEditor({ ledger }: { ledger: Ledger | null }) {
  const router = useRouter()

  const [title, setTitle] = useState(ledger?.title ?? "")
  const [date, setDate] = useState(ledger?.date ?? today())
  const [notes, setNotes] = useState(ledger?.notes ?? "")
  const [rows, setRows] = useState<DraftRow[]>(() =>
    ledger && ledger.rows.length > 0
      ? ledger.rows.map((r) => ({
          key: newKey(),
          name: r.name,
          date: r.date ?? "",
          invoice: String(r.invoice),
          commission: String(r.commission),
          cash: String(r.cash),
        }))
      : [emptyRow()]
  )

  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  useUnsavedGuard(dirty && !saving)

  const touch = () => setDirty(true)

  const amounts = rows.map((r) => ({
    invoice: parseNumber(r.invoice),
    commission: parseNumber(r.commission),
    cash: parseNumber(r.cash),
  }))
  const { cumulative, grandTotal } = ledgerBalances(amounts)

  const update = (index: number, patch: Partial<DraftRow>) => {
    setRows((r) => replaceAt(r, index, { ...r[index]!, ...patch }))
    touch()
  }

  const submit = async () => {
    setSaving(true)
    const result = await saveLedger(ledger?.id ?? null, {
      title,
      date,
      notes,
      rows: rows.map((r) => ({
        name: r.name,
        date: r.date || null,
        invoice: parseNumber(r.invoice),
        commission: parseNumber(r.commission),
        cash: parseNumber(r.cash),
      })),
    })
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    setDirty(false)
    toast.success(fa.common.saved)
    router.push(`/ledgers/${result.id}`)
  }

  return (
    <EditorShell
      title={ledger ? fa.editor.editLedger : fa.editor.newLedger}
      saving={saving}
      onSave={submit}
      summary={[
        { label: fa.common.items, value: String(rows.length) },
        { label: fa.sheets.balance, value: formatAmount(grandTotal), strong: true },
      ]}
    >
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{fa.nav.ledgers}</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRows((r) => [...r, emptyRow()])
                touch()
              }}
            >
              <HugeiconsIcon icon={Add01Icon} />
              {fa.actions.addRow}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <EditorTable
            template="2rem minmax(8rem,1fr) 6.5rem 6.5rem 6.5rem 9.5rem 6.5rem 2.25rem"
            minWidth={860}
            ids={rows.map((r) => r.key)}
            onReorder={(from, to) => {
              setRows((r) => moveRow(r, from, to))
              touch()
            }}
          >
            <EditorHead
              labels={[
                null,
                fa.common.name,
                fa.sheets.invoice,
                fa.sheets.commission,
                fa.sheets.cash,
                fa.common.date,
                { label: fa.sheets.balance, align: "end" as const },
                null,
              ]}
            />

            {rows.map((row, index) => (
              <EditorRow
                key={row.key}
                id={row.key}
                index={index}
                empty={
                  !row.name.trim() && !row.invoice && !row.commission && !row.cash
                }
              >

                <Input
                  value={row.name}
                  aria-label={fa.common.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                />
                <NumberInput
                  value={row.invoice}
                  aria-label={fa.sheets.invoice}
                  onValueChange={(v) => update(index, { invoice: v })}
                />
                <NumberInput
                  value={row.commission}
                  aria-label={fa.sheets.commission}
                  onValueChange={(v) => update(index, { commission: v })}
                />
                <NumberInput
                  value={row.cash}
                  aria-label={fa.sheets.cash}
                  onValueChange={(v) => update(index, { cash: v })}
                />
                <DatePicker
                  value={row.date}
                  onValueChange={(v) => update(index, { date: v })}
                />

                {/* مانده carries forward, so this is the figure the sheet will
                    print on this line — not just this row's own movement. */}
                <EditorComputed
                  value={formatAmount(cumulative[index] ?? 0)}
                  className="text-foreground font-medium"
                />

                <RowActions
                  index={index}
                  rowCount={rows.length}
                  onInsertAbove={() => {
                    setRows((r) => insertAt(r, index, emptyRow()))
                    touch()
                  }}
                  onInsertBelow={() => {
                    setRows((r) => insertAt(r, index + 1, emptyRow()))
                    touch()
                  }}
                  onDuplicate={() => {
                    setRows((r) => insertAt(r, index + 1, { ...r[index]!, key: newKey() }))
                    touch()
                  }}
                  onMoveUp={() => {
                    setRows((r) => moveRow(r, index, index - 1))
                    touch()
                  }}
                  onMoveDown={() => {
                    setRows((r) => moveRow(r, index, index + 1))
                    touch()
                  }}
                  onRemove={() => {
                    setRows((r) => removeAt(r, index))
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
