import { CalendarClock } from 'lucide-react'
import { StaffAvatar } from '@/components/StaffAvatar'

export interface StaffBookable {
  id: string
  name: string
  photoUrl: string | null
  days: { iso: string; slots: string[] }[] // days[0] = hoy
}

function dayLabel(iso: string, isToday: boolean): string {
  if (isToday) return 'Hoy'
  const [y, m, d] = iso.split('-').map(Number)
  const wd = new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '')
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${d}`
}

function DayRow({ iso, slots, isToday }: { iso: string; slots: string[]; isToday: boolean }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-t border-border/60 first:border-t-0">
      <span className={`w-16 shrink-0 text-xs font-bold pt-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
        {dayLabel(iso, isToday)}
      </span>
      {slots.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {slots.map((t) => (
            <span key={t} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">{t}</span>
          ))}
          <span className="px-1 py-1 text-xs text-muted-foreground">({slots.length})</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground pt-1">Sin horas disponibles</span>
      )}
    </div>
  )
}

export function BookableSlotsPanel({ items }: { items: StaffBookable[] }) {
  if (items.length === 0) return null
  const multi = items.length > 1

  return (
    <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 mb-10">
      <p className="text-sm font-bold text-primary mb-1 flex items-center gap-2">
        <CalendarClock className="size-4" /> Horas reservables por clientes
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        Horarios que un cliente todavía puede tomar {multi ? 'con cada una' : 'contigo'} (perros pequeños/medianos).
      </p>

      <div className={multi ? 'space-y-5' : ''}>
        {items.map((it) => (
          <div key={it.id}>
            {multi && (
              <div className="flex items-center gap-2.5 mb-2">
                <StaffAvatar name={it.name} photoUrl={it.photoUrl} size={32} />
                <p className="font-bold text-sm">{it.name}</p>
              </div>
            )}
            <div className="rounded-xl bg-card border border-border px-4 py-2">
              {it.days.map((d, i) => (
                <DayRow key={d.iso} iso={d.iso} slots={d.slots} isToday={i === 0} />
              ))}
              {it.days.length === 0 && <p className="text-xs text-muted-foreground py-2">Sin días laborales esta semana.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
