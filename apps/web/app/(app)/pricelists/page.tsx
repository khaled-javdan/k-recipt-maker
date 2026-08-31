import { DocumentList, type DocumentRow } from "@/components/document-list"
import { PageHeader } from "@/components/page-header"
import { deductionTotals, formatMoney } from "@/lib/calc"
import { listPriceLists } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.nav.priceLists} — ${fa.appName}` }

export default async function PriceListsPage() {
  const priceLists = await listPriceLists()

  const rows: DocumentRow[] = priceLists.map((p) => {
    const totals = deductionTotals({
      lineAmounts: p.items.map((i) => i.price),
      commission: p.commission ?? undefined,
      commissionIsPercent: p.commissionIsPercent,
      expenses: p.expenses,
    })
    return {
      id: p.id,
      number: p.number,
      title: p.title || fa.sheets.priceListTitle,
      date: p.date,
      meta: [`${fa.common.items}: ${p.items.length}`],
      amount: formatMoney(totals.grandTotal),
    }
  })

  return (
    <>
      <PageHeader title={fa.nav.priceLists} />
      <DocumentList rows={rows} basePath="/pricelists" newLabel={fa.actions.new} />
    </>
  )
}
