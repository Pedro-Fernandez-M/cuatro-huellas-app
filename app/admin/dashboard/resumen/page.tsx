import { getDashboardData } from '@/actions/dashboard'
import DashboardManager from '@/components/admin/DashboardManager'

export const dynamic = 'force-dynamic'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function ResumenPage() {
  const data = await getDashboardData(currentMonth())
  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-8">Resumen general del negocio: atenciones, ingresos, clientes y stock.</p>
      <DashboardManager initial={data} />
    </div>
  )
}
