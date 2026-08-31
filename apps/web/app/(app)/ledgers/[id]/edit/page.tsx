import { LedgerEditor } from "@/components/editors/ledger-editor"
import { getLedger } from "@/lib/data"

export default async function EditLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ledger = await getLedger(id)
  return <LedgerEditor ledger={ledger} />
}
