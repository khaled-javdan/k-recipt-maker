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
import { fa } from "@/lib/fa"

const LABELS: Record<string, string> = {
  clients: fa.nav.clients,
  products: fa.nav.products,
  receipts: fa.nav.receipts,
  ledgers: fa.nav.ledgers,
  priceLists: fa.nav.priceLists,
  manReceipts: fa.nav.manReceipts,
  catalog: fa.catalog.priceTitle,
}

export function ImportPanel() {
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
      toast.success(fa.import.done)
      router.refresh()
    } catch {
      toast.error(fa.import.invalidFile)
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{fa.import.title}</CardTitle>
        <CardDescription>{fa.import.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-muted-foreground text-sm">{fa.import.warning}</p>

        <Input
          type="file"
          accept="application/json,.json"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div>
          <Button onClick={run} disabled={!file || running}>
            {running ? fa.import.running : fa.import.run}
          </Button>
        </div>

        {summary ? (
          <div className="grid gap-1 rounded-lg border p-3 text-sm">
            <div className="mb-1 font-medium">{fa.import.summary}</div>
            {Object.entries(summary).map(([key, count]) => (
              <div key={key} className="flex justify-between">
                <span>{LABELS[key] ?? key}</span>
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
