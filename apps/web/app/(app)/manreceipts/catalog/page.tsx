import { CatalogManager } from "@/components/catalog-manager"
import { listCatalog } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.catalog.manTitle} — ${fa.appName}` }

export default async function ManCatalogPage() {
  const items = await listCatalog("MAN")
  return <CatalogManager kind="MAN" items={items} />
}
