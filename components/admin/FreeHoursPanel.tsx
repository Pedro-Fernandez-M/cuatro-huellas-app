import { Clock, CalendarRange } from 'lucide-react'
import { StaffAvatar } from '@/components/StaffAvatar'

export interface FreeHoursItem {
  id: string
  name: string
  photoUrl: string | null
  today: number
  week: number
}

function fmt(h: number): string {
  return `${h.toLocaleString('es-CL', { maximumFractionDigits: 1 })} h`
}

export function FreeHoursPanel({ items }: { items: FreeHoursItem[] }) {
  if (items.length === 0) return null

  // Vista propia (una sola persona): dos tiles grandes.
  if (items.length === 1) {
    const it = items[0]
    return (
      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 mb-10">
        <p className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
          <Clock className="size-4" /> Tus horas disponibles
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-3xl font-black text-primary">{fmt(it.today)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Clock className="size-3" /> libres hoy</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-3xl font-black text-primary">{fmt(it.week)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><CalendarRange className="size-3" /> esta semana</p>
          </div>
        </div>
      </div>
    )
  }

  // Vista admin: todas las funcionarias.
  return (
    <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 mb-10">
      <p className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
        <Clock className="size-4" /> Horas disponibles del equipo
      </p>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <StaffAvatar name={it.name} photoUrl={it.photoUrl} size={40} />
            <p className="font-semibold text-sm flex-1 min-w-0 truncate">{it.name}</p>
            <div className="text-right shrink-0">
              <p className="text-sm"><span className="text-muted-foreground">Hoy</span> <strong className="text-primary">{fmt(it.today)}</strong></p>
            </div>
            <div className="text-right shrink-0 w-28">
              <p className="text-sm"><span className="text-muted-foreground">Semana</span> <strong className="text-primary">{fmt(it.week)}</strong></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
