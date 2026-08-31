import { ClientsManager } from "@/components/clients-manager"
import { listClients } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.nav.clients} — ${fa.appName}` }

export default async function ClientsPage() {
  const clients = await listClients()
  return <ClientsManager clients={clients} />
}
