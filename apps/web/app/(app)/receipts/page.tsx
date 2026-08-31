import { DocumentList, type DocumentRow } from "@/components/document-list"
import { PageHeader } from "@/components/page-header"
import { formatTotalWeight } from "@/lib/calc"
import { listReceipts } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.nav.receipts} — ${fa.appName}` }

export default async function ReceiptsPage() {
  const receipts = await listReceipts()

  const rows: DocumentRow[] = receipts.map((r) => {
    const count = r.items.reduce((s, i) => s + i.quantity, 0)
    const weight = r.items.reduce((s, i) => s + i.weight, 0)
    return {
      id: r.id,
      number: r.number,
      title: r.clientName || fa.sheets.receiptTitle,
      date: r.date,
      meta: [`${fa.common.items}: ${r.items.length}`, `${fa.sheets.count}: ${count}`],
      amount: formatTotalWeight(weight),
    }
  })

  return (
    <>
      <PageHeader title={fa.nav.receipts} />
      <DocumentList rows={rows} basePath="/receipts" newLabel={fa.actions.new} />
    </>
  )
}
