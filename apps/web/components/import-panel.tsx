"use client"

import { useState } from "react"
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

import { importBackup } from "@/actions/import"
import { useT } from "@/components/i18n-provider"

export function ImportPanel() {
  const t = useT()

  // Built per render: the language is only known once the component runs.
  const labels: Record<string, string> = {
    clients: t.nav.clients,
    products: t.nav.products,
    receipts: t.nav.receipts,
    ledgers: t.nav.ledgers,
    priceLists: t.nav.priceLists,
    manReceipts: t.nav.manReceipts,
    catalog: t.catalog.priceTitle,
  }

  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<Record<string, number> | null>(null)

  const run = async () => {
    if (!file) return
    setRunning(true)
    try {
      // Read in the browser and send the text: the backup is a few hundred KB
      // of JSON, well under a server action's payload limit.
      const text = await file.text()
      const result = await importBackup(text)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setSummary(result.summary ?? null)
      toast.success(t.import.done)
      // The documents landed; the logo is the one part the user can redo by
      // hand, so it is a warning beside the summary rather than a failure.
      if (result.warning) toast.warning(result.warning)
      router.refresh()
    } catch {
      toast.error(t.import.invalidFile)
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{t.import.title}</CardTitle>
        <CardDescription>{t.import.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-muted-foreground text-sm">{t.import.warning}</p>

        <Input
          type="file"
          accept="application/json,.json"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div>
          <Button onClick={run} disabled={!file || running}>
            {running ? t.import.running : t.import.run}
          </Button>
        </div>

        {summary ? (
          <div className="grid gap-1 rounded-lg border p-3 text-sm">
            <div className="mb-1 font-medium">{t.import.summary}</div>
            {Object.entries(summary).map(([key, count]) => (
              <div key={key} className="flex justify-between">
                <span>{labels[key] ?? key}</span>
                <span className="tabular-nums" dir="ltr">
                  {count}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
