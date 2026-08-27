'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, Camera, Trash2 } from 'lucide-react'
import type { Staff } from '@/types'
import { updateStaff } from '@/actions/staff'
import { StaffAvatar } from '@/components/StaffAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Toma la foto elegida, la recorta a un cuadrado centrado, la reduce a 256px
 * y la comprime a JPEG. Devuelve un data URL liviano (~20 KB) que se guarda
 * directo en la BD — sin necesidad de un servidor de archivos.
 */
async function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const w = bitmap.width * scale
  const h = bitmap.height * scale
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h)
  bitmap.close?.()
  return canvas.toDataURL('image/jpeg', 0.82)
}

function StaffCard({ member }: { member: Staff }) {
  const [name, setName] = useState(member.name)
  const [photoUrl, setPhotoUrl] = useState(member.photo_url ?? '')
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Elige un archivo de imagen (JPG o PNG).'); return }
    setError(null)
    setUploading(true)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      setPhotoUrl(dataUrl)
      const r = await updateStaff(member.id, { photo_url: dataUrl })
      if (!r.success) setError(r.error ?? 'No se pudo guardar la foto.')
      else router.refresh()
    } catch {
      setError('No se pudo procesar la imagen. Prueba con otra foto.')
    } finally {
      setUploading(false)
    }
  }

  function removePhoto() {
    setError(null)
    startTransition(async () => {
      await updateStaff(member.id, { photo_url: null })
      setPhotoUrl('')
      router.refresh()
    })
  }

  function saveName() {
    setSaved(false)
    startTransition(async () => {
      await updateStaff(member.id, { name: name.trim() || member.name })
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
    <div className={`p-5 rounded-xl border bg-card ${member.active ? 'border-border' : 'border-border/50 opacity-60'}`}>
      <div className="flex items-start gap-5">
        {/* Foto + botón de subir */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative">
            <StaffAvatar name={member.name} photoUrl={photoUrl} size={96} />
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 className="size-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || isPending}>
            <Camera className="size-3.5" /> {photoUrl ? 'Cambiar' : 'Subir foto'}
          </Button>
          {photoUrl && (
            <button onClick={removePhoto} disabled={uploading || isPending} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
              <Trash2 className="size-3" /> Quitar
            </button>
          )}
        </div>

        {/* Datos */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {member.role === 'admin' ? 'Administradora' : 'Asistente'} · {member.email}
              </p>
            </div>
            <button
              onClick={toggleActive}
              disabled={isPending || uploading}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${member.active ? 'bg-primary' : 'bg-muted-foreground/30'} disabled:opacity-50`}
              title={member.active ? 'Activa — clic para desactivar' : 'Inactiva — clic para activar'}
            >
              <span className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${member.active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <Label className="text-xs mb-1">Nombre visible</Label>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
              <Button size="sm" onClick={saveName} disabled={isPending || uploading}>
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              </Button>
            </div>
          </div>
          {saved && !isPending && <p className="text-xs text-primary">Guardado ✓</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default function StaffManager({ staff }: { staff: Staff[] }) {
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl bg-secondary/50 border border-border text-sm text-muted-foreground">
        Administra a las funcionarias que aparecen en la reserva y en la web. Toca <strong>Subir foto</strong> para
        elegir una imagen desde tu computador o teléfono — se recorta y ajusta sola. Mientras no subas una,
        se muestra un círculo con sus iniciales.
      </div>
      {staff.map((m) => <StaffCard key={m.id} member={m} />)}
    </div>
  )
}
