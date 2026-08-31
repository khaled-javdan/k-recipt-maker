import { deleteManReceipt } from "@/actions/documents"
import { DocumentView } from "@/components/document-view"
import { ManReceiptSheet } from "@/components/sheets/man-receipt-sheet"
import { getManReceipt, getSettings } from "@/lib/data"

export default async function ManReceiptViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [manReceipt, settings] = await Promise.all([getManReceipt(id), getSettings()])

  return (
    <DocumentView
      filename={`man-receipt-${manReceipt.number}`}
      editHref={`/manreceipts/${manReceipt.id}/edit`}
      onDelete={async () => {
        "use server"
        await deleteManReceipt(id)
      }}
    >
      <ManReceiptSheet manReceipt={manReceipt} settings={settings} />
    </DocumentView>
  )
}
