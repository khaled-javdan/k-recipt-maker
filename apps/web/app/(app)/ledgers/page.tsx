import { DocumentList, type DocumentRow } from "@/components/document-list"
import { PageHeader } from "@/components/page-header"
import { formatAmount, ledgerBalances } from "@/lib/calc"
import { listLedgers } from "@/lib/data"
import { getT } from "@/lib/i18n/server"

// Titles are part of the translated surface, so they are resolved per
// request like everything else rather than frozen at module load.
export async function generateMetadata() {
  const t = await getT()
  return { title: `${t.nav.ledgers} — ${t.appName}` }
}

export default async function LedgersPage() {
  const t = await getT()

  const ledgers = await listLedgers()

  const rows: DocumentRow[] = ledgers.map((l) => ({
    id: l.id,
    number: l.number,
    title: l.title || t.sheets.ledgerTitle,
    date: l.date,
    meta: [`${t.common.items}: ${l.rows.length}`],
    amount: formatAmount(ledgerBalances(l.rows).grandTotal),
  }))

  return (
    <>
      <PageHeader title={t.nav.ledgers} />
      <DocumentList rows={rows} basePath="/ledgers" newLabel={t.actions.new} />
    </>
  )
}
