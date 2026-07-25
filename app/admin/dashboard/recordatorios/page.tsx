import Link from 'next/link'
import { Bell, PawPrint, Clock, Info, AlertTriangle } from 'lucide-react'
import { listAppointmentsForDate } from '@/actions/appointments'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { todayInShopTz, formatDateLongCap } from '@/lib/date'
import { isValidCLMobile } from '@/lib/whatsapp'
import { WhatsAppButton } from '@/components/admin/WhatsAppButton'
import { DayPicker } from '@/components/admin/DayPicker'
import { SendAllReminders } from '@/components/admin/SendAllReminders'

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
  const today = todayInShopTz()
  const tomorrow = addDays(today, 1)
  const target = /^\d{4}-\d{2}-\d{2}$/.test(dia ?? '') ? dia! : tomorrow

  const appointments = (await listAppointmentsForDate(target)).filter((a) => a.status === 'booked')
  const validCount = appointments.filter((a) => isValidCLMobile(a.owner_phone)).length

  const base = '/admin/dashboard/recordatorios'
  const chip = (active: boolean) =>
    `h-10 px-4 rounded-xl text-sm font-semibold transition-all ${active ? 'gradient-warm text-primary-foreground' : 'border border-border hover:bg-secondary/60'}`

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-black tracking-tight mb-1">Recordatorios</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Envía por WhatsApp el recordatorio de las citas de un día.
      </p>

      {/* Atajos + selector */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <Link href={`${base}?dia=${today}`} className={chip(target === today)}>Hoy</Link>
        <Link href={`${base}?dia=${tomorrow}`} className={chip(target === tomorrow)}>Mañana</Link>
        <span className="text-muted-foreground text-sm px-1">o</span>
        <DayPicker value={target} basePath={base} />
      </div>
      <p className="text-sm font-semibold mb-6">{formatDateLongCap(target)}</p>

      {appointments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Bell className="size-10 mx-auto mb-3 opacity-30" />
          <p>No hay citas pendientes para ese día.</p>
        </div>
      ) : (
        <>
          <SendAllReminders appointments={appointments} />

          <div className="space-y-2.5 mb-8">
            {appointments.map((a) => {
              const valid = isValidCLMobile(a.owner_phone)
              return (
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
                        {serviceLabel(a.service)} · {sizeLabel(a.size_category)} · {a.owner_phone || 'sin teléfono'}
                      </p>
                      {!valid && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="size-3" /> Teléfono inválido — revisa el número del cliente
                        </p>
                      )}
                    </div>
                  </div>
                  {valid ? (
                    <WhatsAppButton appointment={a} />
                  ) : (
                    <span className="text-xs text-muted-foreground shrink-0">Sin WhatsApp</span>
                  )}
                </div>
              )
            })}
          </div>

          {validCount < appointments.length && (
            <div className="p-3 rounded-xl border border-amber-300 bg-amber-50 text-xs text-amber-800 flex gap-2 mb-4">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <p>{appointments.length - validCount} cita(s) tienen un teléfono inválido y no se les puede enviar WhatsApp. Corrige el número en la ficha del cliente.</p>
            </div>
          )}
        </>
      )}

      <div className="p-4 rounded-xl border border-border bg-secondary/40 text-xs text-muted-foreground flex gap-2.5">
        <Info className="size-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Al tocar <strong>WhatsApp</strong> se abre la conversación con el mensaje ya escrito; solo aprietas enviar.
          Para que los recordatorios salgan <strong>solos</strong> se necesita la API de WhatsApp Business (con costo por mensaje).
        </p>
      </div>
    </div>
  )
}
