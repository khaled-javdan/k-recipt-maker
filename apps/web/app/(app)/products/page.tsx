import { ProductsManager } from "@/components/products-manager"
import { listProducts } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.nav.products} — ${fa.appName}` }

export default async function ProductsPage() {
  const products = await listProducts()
  return <ProductsManager products={products} />
}
