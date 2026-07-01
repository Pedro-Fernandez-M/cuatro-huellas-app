'use client'

import { useState, useTransition } from 'react'
import { Phone, Pencil, Loader2, Check } from 'lucide-react'
import type { Client } from '@/types'
import { updateClient } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export function ClientHeaderEditor({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false)
  const [ownerName, setOwnerName] = useState(client.owner_name)
  const [ownerPhone, setOwnerPhone] = useState(client.owner_phone)
  const [saved, setSaved] = useState({ owner_name: client.owner_name, owner_phone: client.owner_phone })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    if (!ownerName.trim() || !ownerPhone.trim()) {
      setError('Nombre y teléfono son obligatorios')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await updateClient(client.id, { owner_name: ownerName.trim(), owner_phone: ownerPhone.trim() })
      if (result.success) {
        setSaved({ owner_name: ownerName.trim(), owner_phone: ownerPhone.trim() })
        setEditing(false)
      } else {
        setError(result.error ?? 'No se pudo guardar (¿teléfono repetido?)')
      }
    })
  }

  if (editing) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3 max-w-md">
        <div>
          <Label>Nombre del dueño</Label>
          <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </div>
        <div>
          <Label>Teléfono</Label>
          <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} type="tel" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={isPending}>
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => {
            setOwnerName(saved.owner_name); setOwnerPhone(saved.owner_phone); setError(null); setEditing(false)
          }}>Cancelar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-black tracking-tight">{saved.owner_name}</h1>
        <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          <Pencil className="size-3" /> Editar
        </button>
      </div>
      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
        <Phone className="size-3.5 text-primary" /> {saved.owner_phone}
      </p>
    </div>
  )
}
