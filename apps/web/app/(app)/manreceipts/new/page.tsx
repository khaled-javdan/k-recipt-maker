import { ManReceiptEditor } from "@/components/editors/man-receipt-editor"
import { listCatalog } from "@/lib/data"

export default async function NewManReceiptPage() {
  const catalog = await listCatalog("MAN")
  return <ManReceiptEditor manReceipt={null} catalog={catalog} />
}
