import { listUsers } from "@/actions/users"
import { UsersManager } from "@/components/users-manager"
import { requireAdmin } from "@/lib/dal"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.settings.users} — ${fa.appName}` }

export default async function UsersPage() {
  // requireAdmin redirects a non-admin away before any of this renders.
  const admin = await requireAdmin()
  const users = await listUsers()

  return <UsersManager users={users} currentUserId={admin.id} />
}
