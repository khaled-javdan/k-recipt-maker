import { CatalogManager } from "@/components/catalog-manager"
import { listCatalog } from "@/lib/data"
import { getT } from "@/lib/i18n/server"

// Titles are part of the translated surface, so they are resolved per
// request like everything else rather than frozen at module load.
export async function generateMetadata() {
  const t = await getT()
  return { title: `${t.catalog.manTitle} — ${t.appName}` }
}

export default async function ManCatalogPage() {
  const items = await listCatalog("MAN")
  return <CatalogManager kind="MAN" items={items} />
}
