import { CatalogManager } from "@/components/catalog-manager"
import { listCatalog } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.catalog.priceTitle} — ${fa.appName}` }

export default async function PriceCatalogPage() {
  const items = await listCatalog("PRICE")
  return <CatalogManager kind="PRICE" items={items} />
}
