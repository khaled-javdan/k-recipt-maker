import { ManReceiptEditor } from "@/components/editors/man-receipt-editor"
import { getManReceipt, listCatalog } from "@/lib/data"

export default async function EditManReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [manReceipt, catalog] = await Promise.all([
    getManReceipt(id),
    listCatalog("MAN"),
  ])
  return <ManReceiptEditor manReceipt={manReceipt} catalog={catalog} />
}
