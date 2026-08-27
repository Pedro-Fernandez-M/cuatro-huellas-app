import { getAccountingData, getCashClose } from '@/actions/accounting'
import { todayInShopTz } from '@/lib/date'
import AccountingManager from '@/components/admin/AccountingManager'
import { requireAdmin } from '@/lib/auth/roles'

export const dynamic = 'force-dynamic'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function ContabilidadPage() {
  await requireAdmin()
  const today = todayInShopTz()
  const [data, cash] = await Promise.all([getAccountingData(currentMonth()), getCashClose(today)])

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Contabilidad</h1>
      <p className="text-sm text-muted-foreground mb-8">Ingresos, gastos y utilidad del mes. Registra gastos, cuadra la caja y exporta a Excel.</p>
      <AccountingManager initialData={data} initialCashClose={cash} />
    </div>
  )
}
