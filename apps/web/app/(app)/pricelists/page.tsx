import { DocumentList, type DocumentRow } from "@/components/document-list"
import { EarningsPanel } from "@/components/earnings-panel"
import { PageHeader } from "@/components/page-header"
import { bucketDays, resolveRange, toIsoDate } from "@/lib/analytics"
import { deductionTotals, formatMoney } from "@/lib/calc"
import { getSheetEarnings, listEarningRows, listPriceLists } from "@/lib/data"
import { getT } from "@/lib/i18n/server"

// Titles are part of the translated surface, so they are resolved per
// request like everything else rather than frozen at module load.
export async function generateMetadata() {
  const t = await getT()
  return { title: `${t.nav.priceLists} — ${t.appName}` }
}

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
  const t = await getT()

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
      title: p.title || t.sheets.priceListTitle,
      date: p.date,
      meta: [
        `${t.common.items}: ${p.items.length}`,
        `${t.sheets.commission}: ${formatMoney(totals.commission)}`,
      ],
      amount: formatMoney(totals.grandTotal),
    }
  })

  return (
    <>
      <PageHeader title={t.nav.priceLists} />

      <EarningsPanel
        basePath="/pricelists"
        description={t.earnings.descriptionPriceLists}
        untitledLabel={t.sheets.priceListTitle}
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

      <DocumentList rows={rows} basePath="/pricelists" newLabel={t.actions.new} />
    </>
  )
}
