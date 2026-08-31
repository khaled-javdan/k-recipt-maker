import { ImportPanel } from "@/components/import-panel"
import { requireAdmin } from "@/lib/dal"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.import.title} — ${fa.appName}` }

export default async function ImportPage() {
  await requireAdmin()
  return <ImportPanel />
}
