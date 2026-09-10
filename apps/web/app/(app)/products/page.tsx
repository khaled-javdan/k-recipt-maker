import { ProductsManager } from "@/components/products-manager"
import { listProducts } from "@/lib/data"
import { getT } from "@/lib/i18n/server"

// Titles are part of the translated surface, so they are resolved per
// request like everything else rather than frozen at module load.
export async function generateMetadata() {
  const t = await getT()
  return { title: `${t.nav.products} — ${t.appName}` }
}

export default async function ProductsPage() {
  const products = await listProducts()
  return <ProductsManager products={products} />
}
