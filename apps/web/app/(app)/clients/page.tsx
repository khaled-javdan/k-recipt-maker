import { ClientsManager } from "@/components/clients-manager"
import { listClients } from "@/lib/data"
import { getT } from "@/lib/i18n/server"

// Titles are part of the translated surface, so they are resolved per
// request like everything else rather than frozen at module load.
export async function generateMetadata() {
  const t = await getT()
  return { title: `${t.nav.clients} — ${t.appName}` }
}

export default async function ClientsPage() {
  const clients = await listClients()
  return <ClientsManager clients={clients} />
}
