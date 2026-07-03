import { getAllServices, getCatalog } from '@/actions/catalog'
import ServicesManager from '@/components/admin/ServicesManager'

export const dynamic = 'force-dynamic'

export default async function ServiciosPage() {
  const [services, catalog] = await Promise.all([getAllServices(), getCatalog()])

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Servicios y precios</h1>
      <p className="text-sm text-muted-foreground mb-8">Edita los precios y los servicios que ven los clientes en la web.</p>
      <ServicesManager services={services} prices={catalog.prices} />
    </div>
  )
}
