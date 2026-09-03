import { DocumentList, type DocumentRow } from "@/components/document-list"
import { EarningsPanel } from "@/components/earnings-panel"
import { PageHeader } from "@/components/page-header"
import { bucketDays, resolveRange, toIsoDate } from "@/lib/analytics"
import { formatMoney, formatTotalWeight, manReceiptTotals } from "@/lib/calc"
import { getSheetEarnings, listEarningRows, listManReceipts } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.nav.manReceipts} — ${fa.appName}` }

export default async function ManReceiptsPage({
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

  const [earnings, breakdownRows, manReceipts] = await Promise.all([
    getSheetEarnings("MAN", range),
    showDetails ? listEarningRows("MAN", range) : Promise.resolve(null),
    listManReceipts(),
  ])

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
        `${fa.sheets.commission}: ${formatMoney(totals.commission)}`,
      ],
      amount: formatMoney(totals.grandTotal),
    }
  })

  return (
    <>
      <PageHeader title={fa.nav.manReceipts} />

      <EarningsPanel
        basePath="/manreceipts"
        description={fa.earnings.descriptionManReceipts}
        untitledLabel={fa.sheets.manReceiptTitle}
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

      <DocumentList rows={rows} basePath="/manreceipts" newLabel={fa.actions.new} />
    </>
  )
}
