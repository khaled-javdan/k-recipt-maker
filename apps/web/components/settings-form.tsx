"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"

import {
  removeLogo,
  saveBranding,
  saveLedgerColumns,
  savePriceListConfig,
  saveReceiptColumns,
  uploadLogo,
} from "@/actions/settings"
import { toLatinDigits } from "@/lib/calc"
import { fa } from "@/lib/fa"
import type { LedgerColumns, ReceiptColumns, Settings } from "@/lib/types"

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter()
  const [primary, setPrimary] = useState(settings.primaryColor)
  const [accent, setAccent] = useState(settings.accentColor)
  const [saving, setSaving] = useState(false)

  const [receiptColumns, setReceiptColumns] = useState(settings.receiptColumns)
  const [ledgerColumns, setLedgerColumns] = useState(settings.ledgerColumns)
  const [layout, setLayout] = useState(settings.priceListConfig)

  const [logoUrl, setLogoUrl] = useState(settings.logoUrl)
  const [logoBusy, setLogoBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const pickLogo = async (file: File | undefined) => {
    if (!file) return
    setLogoBusy(true)
    const formData = new FormData()
    formData.set("logo", file)
    const result = await uploadLogo(formData)
    setLogoBusy(false)
    // Clearing the input matters: picking the same file twice in a row fires
    // no change event otherwise, so a failed upload could not be retried.
    if (fileInput.current) fileInput.current.value = ""
    if (result.error) {
      toast.error(result.error)
      return
    }
    setLogoUrl(result.url ?? null)
    toast.success(fa.settings.logoUploaded)
    // The sidebar reads the logo from the layout, which is a server component.
    router.refresh()
  }

  const clearLogo = async () => {
    setLogoBusy(true)
    await removeLogo()
    setLogoBusy(false)
    setLogoUrl(null)
    toast.success(fa.settings.logoRemoved)
    router.refresh()
  }

  const submitBranding = async (formData: FormData) => {
    formData.set("primaryColor", primary)
    formData.set("accentColor", accent)
    setSaving(true)
    const result = await saveBranding(formData)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(fa.common.saved)
    router.refresh()
  }

  // Column toggles save on change: there is one switch and one outcome, so a
  // separate save button would only add a step to forget.
  const toggleReceipt = async (patch: Partial<ReceiptColumns>) => {
    const next = { ...receiptColumns, ...patch }
    setReceiptColumns(next)
    const result = await saveReceiptColumns(next)
    if (result.error) toast.error(result.error)
  }

  const toggleLedger = async (patch: Partial<LedgerColumns>) => {
    const next = { ...ledgerColumns, ...patch }
    setLedgerColumns(next)
    const result = await saveLedgerColumns(next)
    if (result.error) toast.error(result.error)
  }

  const saveLayout = async () => {
    const result = await savePriceListConfig(layout)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(fa.common.saved)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{fa.settings.logo}</CardTitle>
          <CardDescription>{fa.settings.logoDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-muted/40 flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border">
              {logoUrl ? (
                // A plain <img>: the blob host would otherwise need a
                // remotePatterns entry, and the sheets render it this way too.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={fa.settings.logo}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-muted-foreground px-2 text-center text-xs">
                  {fa.settings.logoEmpty}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => pickLogo(e.target.files?.[0])}
              />
              <Button
                variant="outline"
                disabled={logoBusy}
                onClick={() => fileInput.current?.click()}
              >
                {logoBusy
                  ? fa.settings.uploading
                  : logoUrl
                    ? fa.settings.replaceLogo
                    : fa.settings.upload}
              </Button>
              {logoUrl ? (
                <Button variant="ghost" disabled={logoBusy} onClick={clearLogo}>
                  {fa.settings.removeLogo}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{fa.settings.branding}</CardTitle>
          <CardDescription>{fa.settings.brandingDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitBranding} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">{fa.settings.companyName}</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={settings.companyName}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                id="primaryColor"
                label={fa.settings.primaryColor}
                value={primary}
                onChange={setPrimary}
              />
              <ColorField
                id="accentColor"
                label={fa.settings.accentColor}
                value={accent}
                onChange={setAccent}
              />
            </div>

            <div>
              <Button type="submit" disabled={saving}>
                {saving ? fa.editor.saving : fa.actions.save}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{fa.settings.receiptColumns}</CardTitle>
          <CardDescription>{fa.settings.receiptColumnsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <ToggleRow
            id="sign"
            label={fa.settings.showSign}
            checked={receiptColumns.sign}
            onChange={(v) => toggleReceipt({ sign: v })}
          />
          <ToggleRow
            id="count"
            label={fa.settings.showCount}
            checked={receiptColumns.count}
            onChange={(v) => toggleReceipt({ count: v })}
          />
          <ToggleRow
            id="unitWeight"
            label={fa.settings.showUnitWeight}
            checked={receiptColumns.unitWeight}
            onChange={(v) => toggleReceipt({ unitWeight: v })}
          />
          <ToggleRow
            id="totalWeight"
            label={fa.settings.showTotalWeight}
            checked={receiptColumns.totalWeight}
            onChange={(v) => toggleReceipt({ totalWeight: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{fa.settings.ledgerColumns}</CardTitle>
          <CardDescription>{fa.settings.ledgerColumnsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <ToggleRow
            id="invoice"
            label={fa.settings.showInvoice}
            checked={ledgerColumns.invoice}
            onChange={(v) => toggleLedger({ invoice: v })}
          />
          <ToggleRow
            id="ledgerCommission"
            label={fa.settings.showCommission}
            checked={ledgerColumns.commission}
            onChange={(v) => toggleLedger({ commission: v })}
          />
          <ToggleRow
            id="cash"
            label={fa.settings.showCash}
            checked={ledgerColumns.cash}
            onChange={(v) => toggleLedger({ cash: v })}
          />
          <ToggleRow
            id="balance"
            label={fa.settings.showBalance}
            checked={ledgerColumns.balance}
            onChange={(v) => toggleLedger({ balance: v })}
          />
          <ToggleRow
            id="ledgerDate"
            label={fa.settings.showDate}
            checked={ledgerColumns.date}
            onChange={(v) => toggleLedger({ date: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{fa.settings.layout}</CardTitle>
          <CardDescription>{fa.settings.layoutDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="itemsPerColumn">{fa.settings.itemsPerColumn}</Label>
              <Input
                id="itemsPerColumn"
                dir="ltr"
                inputMode="numeric"
                value={String(layout.itemsPerColumn)}
                onChange={(e) =>
                  setLayout((l) => ({
                    ...l,
                    itemsPerColumn: Number(toLatinDigits(e.target.value)) || 1,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxColumns">{fa.settings.maxColumns}</Label>
              <Input
                id="maxColumns"
                dir="ltr"
                inputMode="numeric"
                value={String(layout.maxColumns)}
                onChange={(e) =>
                  setLayout((l) => ({
                    ...l,
                    maxColumns: Number(toLatinDigits(e.target.value)) || 1,
                  }))
                }
              />
            </div>
          </div>
          <div>
            <Button onClick={saveLayout}>{fa.actions.save}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <label
          className="border-input relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-md border"
          style={{ background: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
        <Input
          id={id}
          value={value}
          dir="ltr"
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
        />
      </div>
    </div>
  )
}
