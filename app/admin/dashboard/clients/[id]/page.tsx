import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getClient, getClientAppointmentHistory } from '@/actions/clients'
import { serviceLabel } from '@/lib/constants/services'
import { formatDateLong, formatCLP } from '@/lib/date'
import { Badge } from '@/components/ui/badge'
import { PetProfileEditor } from '@/components/admin/PetProfileEditor'
import { ClientHeaderEditor } from '@/components/admin/ClientHeaderEditor'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' }> = {
  booked: { label: 'Reservado', variant: 'primary' },
  arrived: { label: 'En el local', variant: 'warning' },
  completed: { label: 'Completado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'default' },
  no_show: { label: 'No llegó', variant: 'default' },
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()
  const history = await getClientAppointmentHistory(id)

  return (
    <div className="max-w-2xl">
      <Link href="/admin/dashboard/clients" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit">
        <ChevronLeft className="size-4" /> Volver
      </Link>

      <ClientHeaderEditor client={client} />

      {client.pets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Mascotas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {client.pets.map((p) => (
              <PetProfileEditor key={p.id} pet={p} />
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Historial de citas</h2>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin citas registradas.</p>
      ) : (
        <div className="space-y-2">
          {history.map((a) => {
            const badge = STATUS_BADGE[a.status]
            return (
              <div key={a.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card flex-wrap">
                <div>
                  <p className="text-sm font-medium capitalize">{formatDateLong(a.appointment_date)} · {a.start_time.slice(0, 5)}</p>
                  <p className="text-xs text-muted-foreground">{a.pet_name} · {serviceLabel(a.service)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {a.price_charged != null && <span className="text-sm font-semibold text-primary">{formatCLP(a.price_charged)}</span>}
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
