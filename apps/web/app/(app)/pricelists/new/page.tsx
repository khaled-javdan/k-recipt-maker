import { PriceListEditor } from "@/components/editors/price-list-editor"
import { listCatalog } from "@/lib/data"

export default async function NewPriceListPage() {
  const catalog = await listCatalog("PRICE")
  return <PriceListEditor priceList={null} catalog={catalog} />
}
