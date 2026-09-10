import { listUsers } from "@/actions/users"
import { UsersManager } from "@/components/users-manager"
import { requireAdmin } from "@/lib/dal"
import { getT } from "@/lib/i18n/server"

// Titles are part of the translated surface, so they are resolved per
// request like everything else rather than frozen at module load.
export async function generateMetadata() {
  const t = await getT()
  return { title: `${t.settings.users} — ${t.appName}` }
}

export default async function UsersPage() {
  // requireAdmin redirects a non-admin away before any of this renders.
  const admin = await requireAdmin()
  const users = await listUsers()

  return <UsersManager users={users} currentUserId={admin.id} />
}
