'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, Check, PawPrint, Receipt } from 'lucide-react'
import type { Appointment, ManualIncome } from '@/types'
import {
  getMonthIncome, updateAppointmentPrice, addManualIncome,
  updateManualIncome, deleteManualIncome, type MonthIncome,
} from '@/actions/income'
import { serviceLabel } from '@/lib/constants/services'
import { PAYMENT_METHODS, paymentMethodLabel, type PaymentMethod } from '@/lib/constants/finance'
import { formatCLP } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function AppointmentIncomeRow({ appt, onChanged }: { appt: Appointment; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(appt.price_charged?.toString() ?? '')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [isPending, startTransition] = useTransition()

  function save() {
    const p = Number(price)
    if (!p || p <= 0) return
    startTransition(async () => {
      const r = await updateAppointmentPrice(appt.id, p)
      if (r.success) { setEditing(false); onChanged() }
    })
  }

  function remove() {
    startTransition(async () => {
      const r = await updateAppointmentPrice(appt.id, null)
      if (r.success) { setConfirmRemove(false); onChanged() }
    })
  }

  return (
    <div className="p-3.5 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5">
            <PawPrint className="size-3.5 text-primary" /> {appt.pet_name}
            <span className="text-muted-foreground font-normal">· {appt.owner_name}</span>
          </p>
          <p className="text-xs text-muted-foreground">{appt.appointment_date} · {serviceLabel(appt.service)} · {paymentMethodLabel(appt.payment_method)}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <span className="font-bold text-primary">{formatCLP(Number(appt.price_charged))}</span>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Editar monto">
                <Pencil className="size-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => setConfirmRemove(true)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Quitar de ingresos">
                <Trash2 className="size-3.5 text-destructive" />
              </button>
            </>
          ) : (
            <>
              <Input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-28 h-9 text-sm" />
              <Button size="sm" onClick={save} disabled={isPending}>
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setPrice(appt.price_charged?.toString() ?? ''); setEditing(false) }}>Cancelar</Button>
            </>
          )}
        </div>
      </div>
      {confirmRemove && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">¿Quitar este monto de los ingresos? La visita se mantiene en el historial, solo se borra el valor cobrado.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={remove} disabled={isPending}>Sí, quitar</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ManualIncomeRow({ income, onChanged }: { income: ManualIncome; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(income.amount.toString())
  const [description, setDescription] = useState(income.description ?? '')
  const [date, setDate] = useState(income.income_date)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  function save() {
    const a = Number(amount)
    if (!a || a <= 0) return
    startTransition(async () => {
      const r = await updateManualIncome(income.id, { amount: a, income_date: date, description: description.trim() || null })
      if (r.success) { setEditing(false); onChanged() }
    })
  }

  function remove() {
    startTransition(async () => {
      const r = await deleteManualIncome(income.id)
      if (r.success) onChanged()
    })
  }

  return (
    <div className="p-3.5 rounded-xl border border-border bg-card">
      {!editing ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Receipt className="size-3.5 text-primary" /> {income.description || 'Ingreso manual'}
            </p>
            <p className="text-xs text-muted-foreground">{income.income_date} · {paymentMethodLabel(income.payment_method)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{formatCLP(income.amount)}</span>
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
          <Input placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 text-sm" />
          <div className="flex gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm" />
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-sm w-32" />
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
          <p className="text-xs text-muted-foreground">¿Eliminar este ingreso?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={remove} disabled={isPending}>Sí, eliminar</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddManualIncomeForm({ onAdded }: { onAdded: () => void }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState<PaymentMethod>('efectivo')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    const a = Number(amount)
    if (!a || a <= 0) { setError('Ingresa un monto válido'); return }
    setError(null)
    startTransition(async () => {
      const r = await addManualIncome(a, date, description, method)
      if (r.success) { setAmount(''); setDescription(''); onAdded() }
      else setError(r.error ?? 'Error')
    })
  }

  return (
    <div className="p-4 rounded-xl border border-dashed border-border space-y-2">
      <Input placeholder="Descripción (ej: venta shampoo)" value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 text-sm" />
      <div className="flex gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm" />
        <Input type="number" min="0" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-sm w-32" />
      </div>
      <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="h-9 text-sm">
        {PAYMENT_METHODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" onClick={submit} disabled={isPending}>
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Agregar ingreso
      </Button>
    </div>
  )
}

export default function IncomeManager({ initialMonth, initialData }: { initialMonth: string; initialData: MonthIncome }) {
  const router = useRouter()
  const [month, setMonth] = useState(initialMonth)
  const [data, setData] = useState<MonthIncome>(initialData)
  const [loading, setLoading] = useState(false)

  async function reload(m: string) {
    setLoading(true)
    setData(await getMonthIncome(m))
    setLoading(false)
    router.refresh()
  }

  function changeMonth(m: string) {
    setMonth(m)
    reload(m)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <input
          type="month"
          value={month}
          max={currentMonth()}
          onChange={(e) => changeMonth(e.target.value)}
          className="h-10 px-3 rounded-xl border border-border bg-input/60 text-sm focus:border-primary outline-none"
        />
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total del mes</p>
          <p className="text-2xl font-black text-primary">{loading ? '…' : formatCLP(data.total)}</p>
        </div>
      </div>

      {/* Ingreso de datos arriba */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Registrar ingreso manual</h2>
        <p className="text-xs text-muted-foreground mb-3">Ventas de productos u otros ingresos que no vienen de una atención.</p>
        <AddManualIncomeForm onAdded={() => reload(month)} />
      </div>

      {/* Detalle abajo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Visitas cobradas ({data.appointments.length})</h2>
          <div className="space-y-2">
            {data.appointments.length === 0 && <p className="text-sm text-muted-foreground">Sin visitas cobradas este mes.</p>}
            {data.appointments.map((a) => (
              <AppointmentIncomeRow key={a.id} appt={a} onChanged={() => reload(month)} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Otros ingresos ({data.manuals.length})</h2>
          <div className="space-y-2">
            {data.manuals.length === 0 && <p className="text-sm text-muted-foreground">Sin otros ingresos este mes.</p>}
            {data.manuals.map((mi) => (
              <ManualIncomeRow key={mi.id} income={mi} onChanged={() => reload(month)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
