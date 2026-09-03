import { DocumentList, type DocumentRow } from "@/components/document-list"
import { EarningsPanel } from "@/components/earnings-panel"
import { PageHeader } from "@/components/page-header"
import { bucketDays, resolveRange, toIsoDate } from "@/lib/analytics"
import { deductionTotals, formatMoney } from "@/lib/calc"
import { getSheetEarnings, listEarningRows, listPriceLists } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.nav.priceLists} — ${fa.appName}` }

export default async function PriceListsPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string
    from?: string
    to?: string
    details?: string
  }>
}) {
  const params = await searchParams
  // Everything here comes from a URL anyone can edit, so resolveRange() repairs
  // or falls back rather than letting a bad value reach the query.
  const range = resolveRange(params, toIsoDate(new Date()))

  // The breakdown is a second query, so it runs only when it is on screen.
  const showDetails = params.details === "1"

  const [earnings, breakdownRows, priceLists] = await Promise.all([
    getSheetEarnings("PRICE", range),
    showDetails ? listEarningRows("PRICE", range) : Promise.resolve(null),
    listPriceLists(),
  ])

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
      meta: [
        `${fa.common.items}: ${p.items.length}`,
        `${fa.sheets.commission}: ${formatMoney(totals.commission)}`,
      ],
      amount: formatMoney(totals.grandTotal),
    }
  })

  return (
    <>
      <PageHeader title={fa.nav.priceLists} />

      <EarningsPanel
        basePath="/pricelists"
        description={fa.earnings.descriptionPriceLists}
        untitledLabel={fa.sheets.priceListTitle}
        range={range.key}
        from={range.from}
        to={range.to}
        total={earnings.total}
        sheetCount={earnings.sheetCount}
        average={earnings.average}
        previousTotal={earnings.previousTotal}
        buckets={bucketDays(earnings.byDay, range)}
        rows={breakdownRows}
      />

      <DocumentList rows={rows} basePath="/pricelists" newLabel={fa.actions.new} />
    </>
  )
}
