import { deleteLedger } from "@/actions/documents"
import { DocumentView } from "@/components/document-view"
import { LedgerSheet } from "@/components/sheets/ledger-sheet"
import { getLedger, getSettings } from "@/lib/data"

export default async function LedgerViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [ledger, settings] = await Promise.all([getLedger(id), getSettings()])

  return (
    <DocumentView
      filename={`ledger-${ledger.number}`}
      editHref={`/ledgers/${ledger.id}/edit`}
      onDelete={async () => {
        "use server"
        await deleteLedger(id)
      }}
    >
      <LedgerSheet ledger={ledger} settings={settings} />
    </DocumentView>
  )
}
