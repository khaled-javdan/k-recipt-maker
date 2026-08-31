import { DocumentList, type DocumentRow } from "@/components/document-list"
import { PageHeader } from "@/components/page-header"
import { formatMoney, formatTotalWeight, manReceiptTotals } from "@/lib/calc"
import { listManReceipts } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.nav.manReceipts} — ${fa.appName}` }

export default async function ManReceiptsPage() {
  const manReceipts = await listManReceipts()

  const rows: DocumentRow[] = manReceipts.map((m) => {
    const totals = manReceiptTotals({
      items: m.items,
      commission: m.commission ?? undefined,
      commissionIsPercent: m.commissionIsPercent,
      expenses: m.expenses,
    })
    return {
      id: m.id,
      number: m.number,
      title: m.title || fa.sheets.manReceiptTitle,
      date: m.date,
      meta: [
        `${fa.common.items}: ${m.items.length}`,
        formatTotalWeight(totals.totalWeight),
      ],
      amount: formatMoney(totals.grandTotal),
    }
  })

  return (
    <>
      <PageHeader title={fa.nav.manReceipts} />
      <DocumentList rows={rows} basePath="/manreceipts" newLabel={fa.actions.new} />
    </>
  )
}
