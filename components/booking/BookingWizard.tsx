'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Scissors, Droplets, Sparkles, Clock, ChevronRight, ChevronLeft, Check,
  Loader2, User, Phone, Calendar, Dog, PawPrint,
} from 'lucide-react'
import MiniCalendar from './MiniCalendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { SERVICES, type ServiceId } from '@/lib/constants/services'
import { SIZES, isMorningOnly, type SizeCategory } from '@/lib/constants/sizes'
import { ADDONS, COAT_CONDITIONS, type AddonId, type CoatCondition } from '@/lib/constants/addons'
import { BREEDS, OTHER_BREED_OPTION } from '@/lib/constants/breeds'
import { getAvailableSlotsAction, getBlockedDatesAction, createBooking } from '@/actions/booking'

type Step = 'service' | 'size' | 'datetime' | 'extras' | 'details' | 'success'

const STEPS: { key: Step; label: string }[] = [
  { key: 'service', label: 'Servicio' },
  { key: 'size', label: 'Tamaño' },
  { key: 'datetime', label: 'Fecha' },
  { key: 'extras', label: 'Extras' },
  { key: 'details', label: 'Datos' },
]

const SERVICE_ICONS = { bano_mantencion: Droplets, servicio_completo: Scissors, bano_comercial: Sparkles }

const detailsSchema = z.object({
  petName: z.string().min(1, 'Ingresa el nombre de tu mascota'),
  breedChoice: z.string().min(1, 'Selecciona una raza'),
  breedOther: z.string().optional(),
  ownerName: z.string().min(2, 'Ingresa tu nombre completo'),
  ownerPhone: z
    .string()
    .min(8, 'Teléfono inválido')
    .regex(/^[0-9+\s()-]+$/, 'El teléfono solo puede contener números'),
}).refine(
  (data) => data.breedChoice !== OTHER_BREED_OPTION || !!data.breedOther?.trim(),
  { message: 'Escribe la raza de tu mascota', path: ['breedOther'] }
)
type DetailsForm = z.infer<typeof detailsSchema>

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current)
  if (idx === -1) return null
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-1.5 ${active ? 'text-primary' : done ? 'text-primary/70' : 'text-muted-foreground'}`}>
              <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${active ? 'bg-primary text-primary-foreground' : done ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                {done ? <Check className="size-3" /> : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${i < idx ? 'bg-primary/40' : 'bg-border'}`} />}
          </div>
        )
      })}
    </div>
  )
}

export default function BookingWizard() {
  const [step, setStep] = useState<Step>('service')
  const [service, setService] = useState<ServiceId | null>(null)
  const [size, setSize] = useState<SizeCategory | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [addons, setAddons] = useState<AddonId[]>([])
  const [coatCondition, setCoatCondition] = useState<CoatCondition | null>(null)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
  })
  const breedChoice = watch('breedChoice')

  useEffect(() => {
    getBlockedDatesAction().then(setBlockedDates)
  }, [])

  function selectService(s: ServiceId) {
    setService(s)
    setStep('size')
  }

  function selectSize(s: SizeCategory) {
    setSize(s)
    setDate(null)
    setTime(null)
    setSlots([])
    setStep('datetime')
  }

  async function selectDate(d: string) {
    if (!size) return
    setDate(d)
    setTime(null)
    setLoadingSlots(true)
    const available = await getAvailableSlotsAction(d, size)
    setSlots(available)
    setLoadingSlots(false)
  }

  function toggleAddon(id: AddonId) {
    setAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  async function onSubmit(data: DetailsForm) {
    if (!service || !size || !date || !time) return
    setServerError(null)
    const breed = data.breedChoice === OTHER_BREED_OPTION ? data.breedOther!.trim() : data.breedChoice

    startTransition(async () => {
      const result = await createBooking({
        service,
        sizeCategory: size,
        addons,
        coatCondition,
        date,
        time,
        petName: data.petName.trim(),
        petBreed: breed,
        ownerName: data.ownerName.trim(),
        ownerPhone: data.ownerPhone.trim(),
      })
      if (result.success) {
        setAppointmentId(result.appointmentId ?? null)
        setStep('success')
      } else {
        setServerError(result.error ?? 'Error desconocido')
      }
    })
  }

  const selectedServiceObj = SERVICES.find((s) => s.id === service)
  const selectedSizeObj = SIZES.find((s) => s.id === size)

  if (step === 'success') {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="size-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
          <Check className="size-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">¡Reserva confirmada!</h2>
        <p className="text-muted-foreground mb-8">Te esperamos con tu peludo en la hora agendada.</p>

        <div className="max-w-sm mx-auto bg-card border border-border rounded-2xl p-6 text-left space-y-3 mb-8">
          <div className="flex items-center gap-3">
            <PawPrint className="size-4 text-primary shrink-0" />
            <span className="text-sm"><span className="text-muted-foreground">Servicio:</span> <strong>{selectedServiceObj?.label}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <Dog className="size-4 text-primary shrink-0" />
            <span className="text-sm"><span className="text-muted-foreground">Tamaño:</span> <strong>{selectedSizeObj?.label}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-primary shrink-0" />
            <span className="text-sm"><span className="text-muted-foreground">Fecha:</span> <strong className="capitalize">{date ? formatDate(date) : ''}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="size-4 text-primary shrink-0" />
            <span className="text-sm"><span className="text-muted-foreground">Hora:</span> <strong>{time}</strong></span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setStep('service')
            setService(null)
            setSize(null)
            setDate(null)
            setTime(null)
            setAddons([])
            setCoatCondition(null)
            setAppointmentId(null)
          }}
        >
          Hacer otra reserva
        </Button>
        {appointmentId && <p className="text-xs text-muted-foreground mt-4">ID: {appointmentId.slice(0, 8).toUpperCase()}</p>}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <StepBar current={step} />

      {/* Paso 1: Servicio */}
      {step === 'service' && (
        <div>
          <h2 className="text-xl font-bold mb-1">¿Qué servicio necesita tu peludo?</h2>
          <p className="text-sm text-muted-foreground mb-6">Elige un servicio</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SERVICES.map((s) => {
              const Icon = SERVICE_ICONS[s.id]
              return (
                <button
                  key={s.id}
                  onClick={() => selectService(s.id)}
                  className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary/60 transition-all"
                >
                  <div className="p-2.5 rounded-lg bg-primary/10 inline-flex mb-4">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <p className="font-semibold text-sm mb-1">{s.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Paso 2: Tamaño */}
      {step === 'size' && (
        <div>
          <button onClick={() => setStep('service')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ChevronLeft className="size-4" /> Volver
          </button>
          <h2 className="text-xl font-bold mb-1">¿Qué tamaño tiene tu perro?</h2>
          <p className="text-sm text-muted-foreground mb-6">Perros grandes y extra grandes solo se agendan durante la mañana</p>
          <div className="grid grid-cols-2 gap-4">
            {SIZES.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSize(s.id)}
                className="text-center p-5 rounded-xl border border-border bg-card hover:border-primary/60 transition-all"
              >
                <Dog className="size-6 text-primary mx-auto mb-3" />
                <p className="font-semibold text-sm mb-1">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.weightRange}</p>
                {isMorningOnly(s.id) && (
                  <p className="text-[10px] text-primary mt-2 font-semibold uppercase tracking-wide">Solo en la mañana</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 3: Fecha y hora */}
      {step === 'datetime' && (
        <div>
          <button onClick={() => setStep('size')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ChevronLeft className="size-4" /> Volver
          </button>
          <div className="flex items-center gap-2 flex-wrap mb-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-3 py-1.5">
              <PawPrint className="size-3.5 text-primary" /> {selectedServiceObj?.label}
            </span>
            <span className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-3 py-1.5">
              <Dog className="size-3.5 text-primary" /> {selectedSizeObj?.label}
            </span>
          </div>
          <h2 className="text-xl font-bold mb-1">¿Cuándo te gustaría venir?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {size && isMorningOnly(size)
              ? 'Perros de este tamaño solo se agendan durante la mañana'
              : 'Elige fecha y horario disponible'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-medium mb-3 text-muted-foreground">Selecciona una fecha</p>
              <MiniCalendar blockedDates={blockedDates} selected={date} onSelect={selectDate} />
            </div>
            <div>
              <p className="text-sm font-medium mb-3 text-muted-foreground">
                {date ? `Horarios para ${formatDate(date)}` : 'Primero elige una fecha'}
              </p>
              {loadingSlots && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 text-primary animate-spin" />
                </div>
              )}
              {!loadingSlots && date && slots.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No hay horarios disponibles para este día.
                </div>
              )}
              {!loadingSlots && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${time === slot ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary hover:border-primary/50'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {date && time && (
            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep('extras')}>
                Continuar <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Paso 4: Extras (opcional) */}
      {step === 'extras' && (
        <div>
          <button onClick={() => setStep('datetime')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ChevronLeft className="size-4" /> Volver
          </button>
          <h2 className="text-xl font-bold mb-1">¿Algo extra? (opcional)</h2>
          <p className="text-sm text-muted-foreground mb-6">Puedes dejar esto en blanco si no aplica</p>

          <p className="text-sm font-medium mb-3">Servicios adicionales</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {ADDONS.map((a) => (
              <Checkbox key={a.id} label={a.label} checked={addons.includes(a.id)} onChange={() => toggleAddon(a.id)} />
            ))}
          </div>

          <p className="text-sm font-medium mb-3">Estado del pelaje</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {COAT_CONDITIONS.map((c) => (
              <Checkbox
                key={c.id}
                label={c.label}
                checked={coatCondition === c.id}
                onChange={() => setCoatCondition(coatCondition === c.id ? null : c.id)}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep('details')}>
              Continuar <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Paso 5: Datos */}
      {step === 'details' && (
        <div>
          <button onClick={() => setStep('extras')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ChevronLeft className="size-4" /> Volver
          </button>
          <h2 className="text-xl font-bold mb-1">Datos de tu mascota y tuyos</h2>
          <p className="text-sm text-muted-foreground mb-6">Sin abono — solo confirmamos tu hora</p>

          <div className="bg-card border border-border rounded-xl p-4 mb-6 text-sm space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
              <PawPrint className="size-3.5 text-primary" /> <span>{selectedServiceObj?.label}</span>
              <span className="mx-1">·</span>
              <Dog className="size-3.5 text-primary" /> <span>{selectedSizeObj?.label}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-3.5 text-primary" />
              <span className="capitalize">{date ? formatDate(date) : ''}</span>
              <span className="mx-1">·</span>
              <Clock className="size-3.5 text-primary" />
              <span>{time}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label><PawPrint className="size-3.5 inline mr-1.5 text-primary" />Nombre de tu mascota</Label>
              <Input {...register('petName')} placeholder="Ej: Firulais" />
              {errors.petName && <p className="text-destructive text-xs mt-1.5">{errors.petName.message}</p>}
            </div>

            <div>
              <Label><Dog className="size-3.5 inline mr-1.5 text-primary" />Raza</Label>
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
              <Label><User className="size-3.5 inline mr-1.5 text-primary" />Tu nombre completo</Label>
              <Input {...register('ownerName')} placeholder="Ej: María González" />
              {errors.ownerName && <p className="text-destructive text-xs mt-1.5">{errors.ownerName.message}</p>}
            </div>

            <div>
              <Label><Phone className="size-3.5 inline mr-1.5 text-primary" />Tu teléfono</Label>
              <Input {...register('ownerPhone')} type="tel" placeholder="Ej: +56 9 1234 5678" />
              {errors.ownerPhone && <p className="text-destructive text-xs mt-1.5">{errors.ownerPhone.message}</p>}
            </div>

            {serverError && (
              <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm">
                {serverError}
              </div>
            )}

            <Button type="submit" disabled={isPending} className="w-full" size="lg">
              {isPending ? (<><Loader2 className="size-5 animate-spin" /> Confirmando...</>) : (<><Check className="size-5" /> Confirmar reserva</>)}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
