import { Bell, PawPrint, Clock, Info } from 'lucide-react'
import { listAppointmentsForDate } from '@/actions/appointments'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { todayInShopTz, formatDateLong } from '@/lib/date'
import { WhatsAppButton } from '@/components/admin/WhatsAppButton'
import { DayPicker } from '@/components/admin/DayPicker'

export const dynamic = 'force-dynamic'

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default async function RecordatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>
}) {
  const { dia } = await searchParams
  const target = /^\d{4}-\d{2}-\d{2}$/.test(dia ?? '') ? dia! : addDays(todayInShopTz(), 1)

  const appointments = (await listAppointmentsForDate(target)).filter((a) => a.status === 'booked')

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-black tracking-tight mb-1">Recordatorios</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Citas de <span className="capitalize font-medium">{formatDateLong(target)}</span>. Envía el recordatorio con un toque.
      </p>

      <div className="mb-6">
        <DayPicker value={target} basePath="/admin/dashboard/recordatorios" />
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Bell className="size-10 mx-auto mb-3 opacity-30" />
          <p>No hay citas pendientes para ese día.</p>
        </div>
      ) : (
        <div className="space-y-2.5 mb-8">
          {appointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground w-16 shrink-0">
                  <Clock className="size-3.5" /> {a.start_time.slice(0, 5)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    <PawPrint className="size-3.5 text-primary" /> {a.pet_name}
                    <span className="text-muted-foreground font-normal">· {a.owner_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {serviceLabel(a.service)} · {sizeLabel(a.size_category)} · {a.owner_phone}
                  </p>
                </div>
              </div>
              <WhatsAppButton appointment={a} />
            </div>
          ))}
        </div>
      )}

      <div className="p-4 rounded-xl border border-border bg-secondary/40 text-xs text-muted-foreground flex gap-2.5">
        <Info className="size-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Al tocar <strong>WhatsApp</strong> se abre la conversación con el mensaje ya escrito; solo aprietas enviar.
          Para que los recordatorios salgan <strong>solos</strong> (sin apretar nada) se necesita la API de WhatsApp
          Business de Meta, que tiene costo por mensaje y un trámite de aprobación.
        </p>
      </div>
    </div>
  )
}
