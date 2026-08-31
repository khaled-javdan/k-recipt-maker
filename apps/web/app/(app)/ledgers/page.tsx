import { DocumentList, type DocumentRow } from "@/components/document-list"
import { PageHeader } from "@/components/page-header"
import { formatAmount, ledgerBalances } from "@/lib/calc"
import { listLedgers } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.nav.ledgers} — ${fa.appName}` }

export default async function LedgersPage() {
  const ledgers = await listLedgers()

  const rows: DocumentRow[] = ledgers.map((l) => ({
    id: l.id,
    number: l.number,
    title: l.title || fa.sheets.ledgerTitle,
    date: l.date,
    meta: [`${fa.common.items}: ${l.rows.length}`],
    amount: formatAmount(ledgerBalances(l.rows).grandTotal),
  }))

  return (
    <>
      <PageHeader title={fa.nav.ledgers} />
      <DocumentList rows={rows} basePath="/ledgers" newLabel={fa.actions.new} />
    </>
  )
}
