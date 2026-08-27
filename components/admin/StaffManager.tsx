'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import type { Staff } from '@/types'
import { updateStaff } from '@/actions/staff'
import { StaffAvatar } from '@/components/StaffAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function StaffCard({ member }: { member: Staff }) {
  const [name, setName] = useState(member.name)
  const [photoUrl, setPhotoUrl] = useState(member.photo_url ?? '')
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  function save() {
    setSaved(false)
    startTransition(async () => {
      await updateStaff(member.id, { name: name.trim() || member.name, photo_url: photoUrl.trim() || null })
      setSaved(true)
      router.refresh()
    })
  }

  function toggleActive() {
    startTransition(async () => {
      await updateStaff(member.id, { active: !member.active })
      router.refresh()
    })
  }

  return (
    <div className={`p-4 rounded-xl border bg-card ${member.active ? 'border-border' : 'border-border/50 opacity-60'}`}>
      <div className="flex items-start gap-4">
        <StaffAvatar name={member.name} photoUrl={photoUrl || member.photo_url} size={64} />
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {member.role === 'admin' ? 'Administradora' : 'Asistente'} · {member.email}
              </p>
            </div>
            <button
              onClick={toggleActive}
              disabled={isPending}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${member.active ? 'bg-primary' : 'bg-muted-foreground/30'} disabled:opacity-50`}
              title={member.active ? 'Activa — clic para desactivar' : 'Inactiva — clic para activar'}
            >
              <span className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${member.active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <Label className="text-xs mb-1">Nombre visible</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1">Foto (URL, ej. /equipo/luisa.jpg)</Label>
            <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Pega la URL de la foto cuando la tengas" className="h-9 text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={save} disabled={isPending}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Guardar
            </Button>
            {saved && !isPending && <span className="text-xs text-primary">Guardado ✓</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StaffManager({ staff }: { staff: Staff[] }) {
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl bg-secondary/50 border border-border text-sm text-muted-foreground">
        Aquí administras a las funcionarias que aparecen en la reserva. Mientras no cargues una foto,
        se muestra un círculo con sus iniciales. Cuando tengas las fotos, súbelas a <code>public/equipo/</code> y
        pon la ruta (ej. <code>/equipo/luisa.jpg</code>).
      </div>
      {staff.map((m) => <StaffCard key={m.id} member={m} />)}
    </div>
  )
}
