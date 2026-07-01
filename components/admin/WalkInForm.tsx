'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Check } from 'lucide-react'
import { SERVICES, type ServiceId } from '@/lib/constants/services'
import { SIZES, type SizeCategory } from '@/lib/constants/sizes'
import { ADDONS, COAT_CONDITIONS, type AddonId, type CoatCondition } from '@/lib/constants/addons'
import { BREEDS, OTHER_BREED_OPTION } from '@/lib/constants/breeds'
import { todayInShopTz } from '@/lib/date'
import { getAvailableSlotsAction } from '@/actions/booking'
import { createWalkIn } from '@/actions/appointments'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

const schema = z.object({
  petName: z.string().min(1, 'Ingresa el nombre de la mascota'),
  breedChoice: z.string().min(1, 'Selecciona una raza'),
  breedOther: z.string().optional(),
  ownerName: z.string().min(2, 'Ingresa el nombre del dueño'),
  ownerPhone: z.string().min(8, 'Teléfono inválido'),
}).refine(
  (data) => data.breedChoice !== OTHER_BREED_OPTION || !!data.breedOther?.trim(),
  { message: 'Escribe la raza', path: ['breedOther'] }
)
type FormValues = z.infer<typeof schema>

export default function WalkInForm() {
  const [service, setService] = useState<ServiceId>(SERVICES[0].id)
  const [size, setSize] = useState<SizeCategory>(SIZES[0].id)
  const [addons, setAddons] = useState<AddonId[]>([])
  const [coatCondition, setCoatCondition] = useState<CoatCondition | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [time, setTime] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })
  const breedChoice = watch('breedChoice')

  const today = todayInShopTz()

  useEffect(() => {
    setLoadingSlots(true)
    setTime(null)
    getAvailableSlotsAction(today, size).then((s) => {
      setSlots(s)
      setTime(s[0] ?? null)
      setLoadingSlots(false)
    })
  }, [size, today])

  function toggleAddon(id: AddonId) {
    setAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  function onSubmit(data: FormValues) {
    if (!time) {
      setServerError('No hay cupo disponible ahora mismo (máximo 3 perros en el local).')
      return
    }
    setServerError(null)
    const breed = data.breedChoice === OTHER_BREED_OPTION ? data.breedOther!.trim() : data.breedChoice

    startTransition(async () => {
      const result = await createWalkIn({
        service,
        sizeCategory: size,
        addons,
        coatCondition,
        date: today,
        time,
        petName: data.petName.trim(),
        petBreed: breed,
        ownerName: data.ownerName.trim(),
        ownerPhone: data.ownerPhone.trim(),
      })
      if (result.success) {
        setSuccess(true)
        reset()
        setAddons([])
        setCoatCondition(null)
      } else {
        setServerError(result.error ?? 'Error desconocido')
      }
    })
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="size-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-5">
          <Check className="size-8 text-primary" />
        </div>
        <h2 className="text-lg font-bold mb-2">Ingreso registrado</h2>
        <p className="text-sm text-muted-foreground mb-6">La mascota quedó marcada como &ldquo;en el local&rdquo;.</p>
        <Button variant="outline" onClick={() => setSuccess(false)}>Registrar otro ingreso</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label>Servicio</Label>
        <Select value={service} onChange={(e) => setService(e.target.value as ServiceId)}>
          {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
      </div>

      <div>
        <Label>Tamaño</Label>
        <Select value={size} onChange={(e) => setSize(e.target.value as SizeCategory)}>
          {SIZES.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.weightRange})</option>)}
        </Select>
      </div>

      <div>
        <Label>Horario de hoy</Label>
        {loadingSlots ? (
          <Loader2 className="size-4 animate-spin text-primary" />
        ) : slots.length === 0 ? (
          <p className="text-sm text-destructive">No hay cupo disponible ahora mismo.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s} type="button" onClick={() => setTime(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${time === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary hover:border-primary/50'}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label>Extras (opcional)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ADDONS.map((a) => (
            <Checkbox key={a.id} label={a.label} checked={addons.includes(a.id)} onChange={() => toggleAddon(a.id)} />
          ))}
        </div>
      </div>

      <div>
        <Label>Estado del pelaje (opcional)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COAT_CONDITIONS.map((c) => (
            <Checkbox key={c.id} label={c.label} checked={coatCondition === c.id} onChange={() => setCoatCondition(coatCondition === c.id ? null : c.id)} />
          ))}
        </div>
      </div>

      <div>
        <Label>Nombre de la mascota</Label>
        <Input {...register('petName')} placeholder="Ej: Firulais" />
        {errors.petName && <p className="text-destructive text-xs mt-1.5">{errors.petName.message}</p>}
      </div>

      <div>
        <Label>Raza</Label>
        <Select {...register('breedChoice')} defaultValue="">
          <option value="" disabled>Selecciona una raza</option>
          {BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
          <option value={OTHER_BREED_OPTION}>{OTHER_BREED_OPTION}</option>
        </Select>
        {errors.breedChoice && <p className="text-destructive text-xs mt-1.5">{errors.breedChoice.message}</p>}
      </div>

      {breedChoice === OTHER_BREED_OPTION && (
        <div>
          <Label>Especifica la raza</Label>
          <Input {...register('breedOther')} placeholder="Ej: Mestizo" />
          {errors.breedOther && <p className="text-destructive text-xs mt-1.5">{errors.breedOther.message}</p>}
        </div>
      )}

      <div>
        <Label>Nombre del dueño</Label>
        <Input {...register('ownerName')} placeholder="Ej: María González" />
        {errors.ownerName && <p className="text-destructive text-xs mt-1.5">{errors.ownerName.message}</p>}
      </div>

      <div>
        <Label>Teléfono del dueño</Label>
        <Input {...register('ownerPhone')} type="tel" placeholder="Ej: +56 9 1234 5678" />
        {errors.ownerPhone && <p className="text-destructive text-xs mt-1.5">{errors.ownerPhone.message}</p>}
      </div>

      {serverError && (
        <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm">
          {serverError}
        </div>
      )}

      <Button type="submit" disabled={isPending || !time} className="w-full" size="lg">
        {isPending ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />} Registrar ingreso
      </Button>
    </form>
  )
}
