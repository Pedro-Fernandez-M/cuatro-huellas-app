'use client'

import { useState, useTransition } from 'react'
import { PawPrint, Dog, Phone, User, Clock, LogIn, LogOut, Loader2, AlertTriangle, Sparkles } from 'lucide-react'
import type { Appointment, Pet, PaymentMethod } from '@/types'
import { checkIn, checkOut, updateArrivalDeparture } from '@/actions/appointments'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { addonLabel, coatConditionLabel } from '@/lib/constants/addons'
import { PAYMENT_METHODS, isCardMethod, cardCommission, netReceived } from '@/lib/constants/finance'
import { estimateTotal } from '@/lib/pricing'
import { formatDateLong, toDateTimeLocalValue, formatCLP } from '@/lib/date'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { WhatsAppButton } from '@/components/admin/WhatsAppButton'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' }> = {
  booked: { label: 'Reservado', variant: 'primary' },
  arrived: { label: 'En el local', variant: 'warning' },
  completed: { label: 'Completado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'default' },
  no_show: { label: 'No llegó', variant: 'default' },
}

function nowLocalInputValue() {
  return toDateTimeLocalValue(new Date().toISOString())
}

export default function CheckinManager({ appointment, pet }: { appointment: Appointment; pet?: Pet | null }) {
  const [appt, setAppt] = useState(appointment)
  const [arrivalValue, setArrivalValue] = useState(toDateTimeLocalValue(appt.arrival_time) || nowLocalInputValue())
  const [departureValue, setDepartureValue] = useState(toDateTimeLocalValue(appt.departure_time) || nowLocalInputValue())
  const [price, setPrice] = useState(
    appt.price_charged?.toString() ??
      estimateTotal({ sizeCategory: appt.size_category, addons: appt.addons, coatCondition: appt.coat_condition }).toString()
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(appt.payment_method ?? 'efectivo')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const badge = STATUS_BADGE[appt.status]

  function handleCheckIn() {
    setError(null)
    startTransition(async () => {
      const iso = new Date(arrivalValue).toISOString()
      const result = await checkIn(appt.id, iso)
      if (result.success) setAppt((a) => ({ ...a, status: 'arrived', arrival_time: iso }))
      else setError(result.error ?? 'Error al registrar llegada')
    })
  }

  function handleCheckOut() {
    setError(null)
    const priceNum = Number(price)
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setError('Ingresa el valor cobrado por el servicio.')
      return
    }
    startTransition(async () => {
      const iso = new Date(departureValue).toISOString()
      const result = await checkOut(appt.id, iso, priceNum, paymentMethod)
      if (result.success) setAppt((a) => ({ ...a, status: 'completed', departure_time: iso, price_charged: priceNum, payment_method: paymentMethod }))
      else setError(result.error ?? 'Error al registrar salida')
    })
  }

  function handleUpdateTimes() {
    setError(null)
    startTransition(async () => {
      const fields: { arrival_time?: string; departure_time?: string; price_charged?: number } = {}
      if (arrivalValue) fields.arrival_time = new Date(arrivalValue).toISOString()
      if (departureValue) fields.departure_time = new Date(departureValue).toISOString()
      if (price) fields.price_charged = Number(price)
      const result = await updateArrivalDeparture(appt.id, fields)
      if (result.success) {
        setAppt((a) => ({ ...a, ...fields }))
      } else setError(result.error ?? 'Error al actualizar')
    })
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-black tracking-tight">{appt.pet_name}</h1>
        <div className="flex items-center gap-2">
          <WhatsAppButton appointment={appt} />
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-2.5 mb-6 text-sm">
        <p className="flex items-center gap-2"><Dog className="size-4 text-primary" /> {appt.pet_breed} · {sizeLabel(appt.size_category)}</p>
        <p className="flex items-center gap-2"><PawPrint className="size-4 text-primary" /> {serviceLabel(appt.service)}</p>
        <p className="flex items-center gap-2"><Clock className="size-4 text-primary" /> <span className="capitalize">{formatDateLong(appt.appointment_date)}</span> · {appt.start_time.slice(0, 5)}</p>
        <p className="flex items-center gap-2"><User className="size-4 text-primary" /> {appt.owner_name}</p>
        <p className="flex items-center gap-2"><Phone className="size-4 text-primary" /> {appt.owner_phone}</p>
        {appt.addons.length > 0 && (
          <p className="text-muted-foreground">Extras: {appt.addons.map((a) => addonLabel(a)).join(', ')}</p>
        )}
        {appt.coat_condition && (
          <p className="text-muted-foreground">Estado del pelaje: {coatConditionLabel(appt.coat_condition)}</p>
        )}
      </div>

      {pet && (pet.temperament || pet.allergies || pet.notes) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2 mb-6 text-sm">
          <p className="font-bold text-amber-800 text-xs uppercase tracking-wide mb-1">Ficha de {pet.name}</p>
          {pet.temperament && <p className="flex items-start gap-2 text-amber-900"><AlertTriangle className="size-4 shrink-0 mt-0.5" /> <span><span className="opacity-70">Carácter:</span> {pet.temperament}</span></p>}
          {pet.allergies && <p className="flex items-start gap-2 text-amber-900"><AlertTriangle className="size-4 shrink-0 mt-0.5" /> <span><span className="opacity-70">Alergias:</span> {pet.allergies}</span></p>}
          {pet.notes && <p className="flex items-start gap-2 text-amber-900"><Sparkles className="size-4 shrink-0 mt-0.5" /> <span><span className="opacity-70">Observaciones:</span> {pet.notes}</span></p>}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="p-5 rounded-2xl border border-border bg-card">
          <Label>Hora de llegada</Label>
          <Input type="datetime-local" value={arrivalValue} onChange={(e) => setArrivalValue(e.target.value)} className="mb-3" />
          {appt.status === 'booked' ? (
            <Button onClick={handleCheckIn} disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />} Marcar llegada
            </Button>
          ) : (
            <Button variant="outline" onClick={handleUpdateTimes} disabled={isPending} className="w-full">
              Actualizar hora de llegada
            </Button>
          )}
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card">
          <Label>Valor del servicio (CLP)</Label>
          <Input type="number" min="0" placeholder="Ej: 15000" value={price} onChange={(e) => setPrice(e.target.value)} className="mb-4" />
          <Label>Método de pago</Label>
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="mb-2">
            {PAYMENT_METHODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </Select>
          {isCardMethod(paymentMethod) && Number(price) > 0 && (
            <p className="text-xs text-muted-foreground mb-4">
              Comisión máquina: <span className="text-destructive font-medium">−{formatCLP(cardCommission(Number(price), paymentMethod))}</span>
              {' · '}Recibes: <span className="text-green-600 font-semibold">{formatCLP(netReceived(Number(price), paymentMethod))}</span>
            </p>
          )}
          {!isCardMethod(paymentMethod) && <div className="mb-4" />}
          <Label>Hora de salida</Label>
          <Input type="datetime-local" value={departureValue} onChange={(e) => setDepartureValue(e.target.value)} className="mb-3" />
          {appt.status === 'arrived' ? (
            <Button onClick={handleCheckOut} disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />} Marcar salida
            </Button>
          ) : appt.status === 'completed' ? (
            <Button variant="outline" onClick={handleUpdateTimes} disabled={isPending} className="w-full">
              Actualizar datos de salida
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Primero marca la llegada de la mascota.</p>
          )}
        </div>
      </div>
    </div>
  )
}
