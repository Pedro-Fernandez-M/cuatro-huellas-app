import { listProducts, listMovements } from '@/actions/inventory'
import InventoryManager from '@/components/admin/InventoryManager'

export const dynamic = 'force-dynamic'

export default async function InventarioPage() {
  const [products, movements] = await Promise.all([listProducts(), listMovements()])

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Inventario</h1>
      <p className="text-sm text-muted-foreground mb-8">Stock de productos y movimientos</p>
      <InventoryManager initialProducts={products} initialMovements={movements} />
    </div>
  )
}
