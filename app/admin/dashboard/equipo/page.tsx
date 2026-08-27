import { getAllStaff } from '@/actions/staff'
import { requireAdmin } from '@/lib/auth/roles'
import StaffManager from '@/components/admin/StaffManager'

export const dynamic = 'force-dynamic'

export default async function EquipoPage() {
  await requireAdmin()
  const staff = await getAllStaff()

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Equipo</h1>
      <p className="text-sm text-muted-foreground mb-8">Las funcionarias que atienden y aparecen en la reserva.</p>
      <StaffManager staff={staff} />
    </div>
  )
}
