import { listExpenses } from '@/actions/expenses'
import GastosManager from '@/components/admin/GastosManager'

export const dynamic = 'force-dynamic'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes } = await searchParams
  const month = /^\d{4}-\d{2}$/.test(mes ?? '') ? mes! : currentMonth()
  const expenses = await listExpenses(month)

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Gastos</h1>
      <p className="text-sm text-muted-foreground mb-8">Registra un gasto arriba; abajo ves el detalle y el desglose por categoría.</p>
      <GastosManager initialMonth={month} initialExpenses={expenses} />
    </div>
  )
}
