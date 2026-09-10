import { DocumentList, type DocumentRow } from "@/components/document-list"
import { PageHeader } from "@/components/page-header"
import { formatTotalWeight } from "@/lib/calc"
import { listReceipts } from "@/lib/data"
import { getT } from "@/lib/i18n/server"

// Titles are part of the translated surface, so they are resolved per
// request like everything else rather than frozen at module load.
export async function generateMetadata() {
  const t = await getT()
  return { title: `${t.nav.receipts} — ${t.appName}` }
}

export default async function ReceiptsPage() {
  const t = await getT()

  const receipts = await listReceipts()

  const rows: DocumentRow[] = receipts.map((r) => {
    const count = r.items.reduce((s, i) => s + i.quantity, 0)
    const weight = r.items.reduce((s, i) => s + i.weight, 0)
    return {
      id: r.id,
      number: r.number,
      title: r.clientName || t.sheets.receiptTitle,
      date: r.date,
      meta: [`${t.common.items}: ${r.items.length}`, `${t.sheets.count}: ${count}`],
      amount: formatTotalWeight(weight),
    }
  })

  return (
    <>
      <PageHeader title={t.nav.receipts} />
      <DocumentList rows={rows} basePath="/receipts" newLabel={t.actions.new} />
    </>
  )
}
