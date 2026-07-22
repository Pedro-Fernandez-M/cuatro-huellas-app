'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, Check, Scissors, DollarSign, Eye, EyeOff } from 'lucide-react'
import type { Service } from '@/types'
import type { PriceMap } from '@/actions/catalog'
import { updatePrice, addService, updateService, deleteService } from '@/actions/catalog'
import { SIZES } from '@/lib/constants/sizes'
import { ADDONS, COAT_CONDITIONS } from '@/lib/constants/addons'
import { formatCLP } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Editor de precios ──────────────────────────────────────
function PricesEditor({ prices }: { prices: PriceMap }) {
  const priceRows: { key: string; label: string }[] = [
    ...SIZES.map((s) => ({ key: `size_${s.id}`, label: `${s.label} (${s.weightRange})` })),
    ...ADDONS.map((a) => ({ key: `addon_${a.id}`, label: a.label + (a.from ? ' (desde)' : '') })),
    ...COAT_CONDITIONS.filter((c) => !c.included).map((c) => ({ key: `coat_${c.id}`, label: `Pelaje: ${c.label}` })),
  ]

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(priceRows.map((r) => [r.key, String(prices[r.key] ?? 0)]))
  )
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function saveAll() {
    setSaved(false)
    startTransition(async () => {
      for (const r of priceRows) {
        const amount = Number(values[r.key])
        if (!Number.isNaN(amount) && amount !== (prices[r.key] ?? 0)) {
          await updatePrice(r.key, amount)
        }
      }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div>
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
        <DollarSign className="size-4" /> Precios por tamaño y extras
      </h2>
      <p className="text-xs text-muted-foreground mb-4">Estos valores se muestran en la web y se sugieren al cobrar.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {priceRows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
            <span className="text-sm">{r.label}</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                type="number"
                min="0"
                value={values[r.key]}
                onChange={(e) => setValues((v) => ({ ...v, [r.key]: e.target.value }))}
                className="w-24 h-9 px-2 rounded-lg border border-border bg-input/60 text-sm text-right focus:border-primary outline-none"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={saveAll} disabled={isPending}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Guardar precios
        </Button>
        {saved && !isPending && <span className="text-xs text-primary">Precios actualizados ✓</span>}
      </div>
    </div>
  )
}

// ─── Servicio (fila editable) ───────────────────────────────
function ServiceRow({ service }: { service: Service }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(service.name)
  const [description, setDescription] = useState(service.description ?? '')
  const [includesText, setIncludesText] = useState((service.includes ?? []).join('\n'))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    if (!name.trim()) return
    startTransition(async () => {
      await updateService(service.id, {
        name: name.trim(),
        description: description.trim() || null,
        includes: includesText.split('\n').map((s) => s.trim()).filter(Boolean),
      })
      setEditing(false)
      router.refresh()
    })
  }

  function toggleActive() {
    startTransition(async () => {
      await updateService(service.id, { active: !service.active })
      router.refresh()
    })
  }

  function remove() {
    startTransition(async () => {
      await deleteService(service.id)
      router.refresh()
    })
  }

  return (
    <div className={`p-4 rounded-xl border bg-card ${service.active ? 'border-border' : 'border-border/50 opacity-60'}`}>
      {!editing ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm flex items-center gap-2">
              {service.name}
              {!service.active && <span className="text-[10px] uppercase tracking-wide bg-secondary px-1.5 py-0.5 rounded">Oculto</span>}
            </p>
            {service.description && <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>}
            {service.includes.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">Incluye: {service.includes.join(', ')}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={toggleActive} disabled={isPending} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title={service.active ? 'Ocultar de la web' : 'Mostrar en la web'}>
              {service.active ? <Eye className="size-3.5 text-muted-foreground" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
            </button>
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Editar">
              <Pencil className="size-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Eliminar">
              <Trash2 className="size-3.5 text-destructive" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del servicio" className="h-9 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descripción"
            className="w-full px-3 py-2 rounded-lg border border-border bg-input/60 text-sm focus:border-primary outline-none resize-none" />
          <div>
            <Label className="text-xs mb-1">Qué incluye (uno por línea)</Label>
            <textarea value={includesText} onChange={(e) => setIncludesText(e.target.value)} rows={4} placeholder="Baño desmugrante&#10;Corte de uñas&#10;..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-input/60 text-sm focus:border-primary outline-none resize-none" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={isPending}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">¿Eliminar &ldquo;{service.name}&rdquo;? Las citas antiguas con este servicio se mantienen.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={remove} disabled={isPending}>Sí, eliminar</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddServiceForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    if (!name.trim()) { setError('Ingresa un nombre'); return }
    setError(null)
    startTransition(async () => {
      const r = await addService({ name, description })
      if (r.success) { setName(''); setDescription(''); router.refresh() }
      else setError(r.error ?? 'Error')
    })
  }

  return (
    <div className="p-4 rounded-xl border border-dashed border-border space-y-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del servicio nuevo" className="h-9 text-sm" />
      <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)" className="h-9 text-sm" />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" onClick={submit} disabled={isPending}>
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Agregar servicio
      </Button>
    </div>
  )
}

export default function ServicesManager({ services, prices }: { services: Service[]; prices: PriceMap }) {
  return (
    <div className="space-y-10">
      <PricesEditor prices={prices} />

      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
          <Scissors className="size-4" /> Servicios (se muestran en la web)
        </h2>
        <div className="space-y-2.5 mb-4">
          {services.map((s) => <ServiceRow key={s.id} service={s} />)}
        </div>
        <AddServiceForm />
      </div>
    </div>
  )
}
