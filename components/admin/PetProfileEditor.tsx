'use client'

import { useState, useTransition } from 'react'
import { Dog, Pencil, Loader2, Check, AlertTriangle, Sparkles } from 'lucide-react'
import type { Pet } from '@/types'
import { updatePet } from '@/actions/clients'
import { SIZES, sizeLabel, type SizeCategory } from '@/lib/constants/sizes'
import { BREEDS } from '@/lib/constants/breeds'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function PetProfileEditor({ pet }: { pet: Pet }) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState<Pet>(pet)

  const [name, setName] = useState(pet.name)
  const [breed, setBreed] = useState(pet.breed)
  const [size, setSize] = useState<SizeCategory>(pet.size_category)
  const [temperament, setTemperament] = useState(pet.temperament ?? '')
  const [allergies, setAllergies] = useState(pet.allergies ?? '')
  const [notes, setNotes] = useState(pet.notes ?? '')

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    if (!name.trim() || !breed.trim()) {
      setError('Nombre y raza son obligatorios')
      return
    }
    setError(null)
    startTransition(async () => {
      const fields = {
        name: name.trim(),
        breed: breed.trim(),
        size_category: size,
        temperament: temperament.trim() || null,
        allergies: allergies.trim() || null,
        notes: notes.trim() || null,
      }
      const result = await updatePet(pet.id, fields)
      if (result.success) {
        setSaved({ ...saved, ...fields })
        setEditing(false)
      } else {
        setError(result.error ?? 'No se pudo guardar')
      }
    })
  }

  function cancel() {
    setName(saved.name); setBreed(saved.breed); setSize(saved.size_category)
    setTemperament(saved.temperament ?? ''); setAllergies(saved.allergies ?? ''); setNotes(saved.notes ?? '')
    setError(null); setEditing(false)
  }

  const hasProfile = saved.temperament || saved.allergies || saved.notes

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-sm flex items-center gap-1.5"><Dog className="size-4 text-primary" /> {saved.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{saved.breed} · {sizeLabel(saved.size_category)}</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Pencil className="size-3" /> Editar
          </button>
        )}
      </div>

      {!editing && (
        <div className="mt-2 space-y-1.5 text-xs">
          {saved.temperament && <p className="flex items-start gap-1.5"><AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" /> <span><span className="text-muted-foreground">Carácter:</span> {saved.temperament}</span></p>}
          {saved.allergies && <p className="flex items-start gap-1.5"><AlertTriangle className="size-3.5 text-red-500 shrink-0 mt-0.5" /> <span><span className="text-muted-foreground">Alergias:</span> {saved.allergies}</span></p>}
          {saved.notes && <p className="flex items-start gap-1.5"><Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" /> <span><span className="text-muted-foreground">Observaciones:</span> {saved.notes}</span></p>}
          {!hasProfile && <p className="text-muted-foreground italic">Sin ficha aún. Toca &ldquo;Editar&rdquo; para agregar datos.</p>}
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-3">
          <div>
            <Label className="text-xs mb-1">Nombre de la mascota</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1">Raza</Label>
            <Input list={`breeds-${pet.id}`} value={breed} onChange={(e) => setBreed(e.target.value)} className="h-9 text-sm" placeholder="Ej: Poodle" />
            <datalist id={`breeds-${pet.id}`}>
              {BREEDS.map((b) => <option key={b} value={b} />)}
            </datalist>
          </div>
          <div>
            <Label className="text-xs mb-1">Tamaño</Label>
            <Select value={size} onChange={(e) => setSize(e.target.value as SizeCategory)} className="h-9 text-sm">
              {SIZES.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.weightRange})</option>)}
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1">Carácter</Label>
            <Input value={temperament} onChange={(e) => setTemperament(e.target.value)} placeholder="Ej: nervioso, muerde, tranquilo" className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1">Alergias / piel sensible</Label>
            <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Ej: alérgico, usar shampoo hipoalergénico" className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1">Observaciones (corte preferido, etc.)</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ej: corte a máquina #2, dejar orejas largas"
              className="w-full px-3 py-2 rounded-lg border border-border bg-input/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={isPending}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
