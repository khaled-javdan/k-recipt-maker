import { deleteReceipt } from "@/actions/documents"
import { DocumentView } from "@/components/document-view"
import { ReceiptSheet } from "@/components/sheets/receipt-sheet"
import { getReceipt, getSettings } from "@/lib/data"

export default async function ReceiptViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [receipt, settings] = await Promise.all([getReceipt(id), getSettings()])

  return (
    <DocumentView
      filename={`receipt-${receipt.number}`}
      editHref={`/receipts/${receipt.id}/edit`}
      onDelete={async () => {
        "use server"
        await deleteReceipt(id)
      }}
    >
      <ReceiptSheet receipt={receipt} settings={settings} />
    </DocumentView>
  )
}
