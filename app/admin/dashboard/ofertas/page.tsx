import { getAllOffers } from '@/actions/offers'
import OffersManager from '@/components/admin/OffersManager'
import { requireAdmin } from '@/lib/auth/roles'

export const dynamic = 'force-dynamic'

export default async function OfertasPage() {
  await requireAdmin()
  const offers = await getAllOffers()

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Ofertas y promociones</h1>
      <p className="text-sm text-muted-foreground mb-8">Escribe tus descuentos y decide cuáles se muestran en la web.</p>
      <OffersManager offers={offers} />
    </div>
  )
}
