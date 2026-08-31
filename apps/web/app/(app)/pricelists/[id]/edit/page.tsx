import { PriceListEditor } from "@/components/editors/price-list-editor"
import { getPriceList, listCatalog } from "@/lib/data"

export default async function EditPriceListPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [priceList, catalog] = await Promise.all([getPriceList(id), listCatalog("PRICE")])
  return <PriceListEditor priceList={priceList} catalog={catalog} />
}
