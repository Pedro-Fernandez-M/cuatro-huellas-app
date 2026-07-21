import WalkInForm from '@/components/admin/WalkInForm'
import { getCatalog } from '@/actions/catalog'

export const dynamic = 'force-dynamic'

export default async function WalkInPage() {
  const { services } = await getCatalog()
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black tracking-tight mb-1">Agregar a la agenda</h1>
      <p className="text-sm text-muted-foreground mb-8">Alta manual sin restricciones: cualquier hora, aunque el local esté lleno</p>
      <WalkInForm services={services.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  )
}
