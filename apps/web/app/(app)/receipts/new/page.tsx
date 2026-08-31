import { ReceiptEditor } from "@/components/editors/receipt-editor"
import { listClients, listProducts } from "@/lib/data"

export default async function NewReceiptPage() {
  const [clients, products] = await Promise.all([listClients(), listProducts()])
  return <ReceiptEditor receipt={null} clients={clients} products={products} />
}
