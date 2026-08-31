import { ReceiptEditor } from "@/components/editors/receipt-editor"
import { getReceipt, listClients, listProducts } from "@/lib/data"

export default async function EditReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [receipt, clients, products] = await Promise.all([
    getReceipt(id),
    listClients(),
    listProducts(),
  ])
  return <ReceiptEditor receipt={receipt} clients={clients} products={products} />
}
