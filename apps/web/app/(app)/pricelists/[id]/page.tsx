import { deletePriceList } from "@/actions/documents"
import { DocumentView } from "@/components/document-view"
import { PriceListSheet } from "@/components/sheets/price-list-sheet"
import { getPriceList, getSettings } from "@/lib/data"

export default async function PriceListViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [priceList, settings] = await Promise.all([getPriceList(id), getSettings()])

  return (
    <DocumentView
      filename={`pricelist-${priceList.number}`}
      editHref={`/pricelists/${priceList.id}/edit`}
      onDelete={async () => {
        "use server"
        await deletePriceList(id)
      }}
    >
      <PriceListSheet priceList={priceList} settings={settings} />
    </DocumentView>
  )
}
