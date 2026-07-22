'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Loader2, Check, Wallet } from 'lucide-react'
import type { Expense, PaymentMethod } from '@/types'
import { addExpense, updateExpense, deleteExpense } from '@/actions/expenses'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, paymentMethodLabel } from '@/lib/constants/finance'
import { formatCLP } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

function ExpenseRow({ expense, onChanged }: { expense: Expense; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(expense.amount.toString())
  const [category, setCategory] = useState(expense.category)
  const [description, setDescription] = useState(expense.description ?? '')
  const [date, setDate] = useState(expense.expense_date)
  const [method, setMethod] = useState<PaymentMethod>(expense.payment_method ?? 'efectivo')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  function save() {
    const a = Number(amount)
    if (!a || a <= 0) return
    startTransition(async () => {
      const r = await updateExpense(expense.id, {
        amount: a, category: category.trim(), description: description.trim() || null,
        expense_date: date, payment_method: method,
      })
      if (r.success) { setEditing(false); onChanged() }
    })
  }

  function remove() {
    startTransition(async () => {
      const r = await deleteExpense(expense.id)
      if (r.success) onChanged()
    })
  }

  return (
    <div className="p-3.5 rounded-xl border border-border bg-card">
      {!editing ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium">{expense.category}</p>
            <p className="text-xs text-muted-foreground">
              {expense.expense_date}{expense.description ? ` · ${expense.description}` : ''} · {paymentMethodLabel(expense.payment_method)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-destructive">−{formatCLP(expense.amount)}</span>
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
          <Input list="expense-cats-edit" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoría" className="h-9 text-sm" />
          <Input placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 text-sm" />
          <div className="flex gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm" />
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-sm w-32" />
          </div>
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="h-9 text-sm">
            {PAYMENT_METHODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </Select>
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
          <p className="text-xs text-muted-foreground">¿Eliminar este gasto?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={remove} disabled={isPending}>Sí, eliminar</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddExpenseForm({ month, onAdded }: { month: string; onAdded: () => void }) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(`${month}-${String(new Date().getDate()).padStart(2, '0')}`)
  const [method, setMethod] = useState<PaymentMethod>('efectivo')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    const a = Number(amount)
    if (!a || a <= 0) { setError('Ingresa un monto válido'); return }
    if (!category.trim()) { setError('Ingresa una categoría'); return }
    setError(null)
    startTransition(async () => {
      const r = await addExpense({ amount: a, category, description, date, paymentMethod: method })
      if (r.success) { setAmount(''); setCategory(''); setDescription(''); onAdded() }
      else setError(r.error ?? 'Error')
    })
  }

  return (
    <div className="p-4 rounded-xl border border-dashed border-border space-y-2">
      <Input list="expense-cats" placeholder="Categoría (arriendo, insumos...)" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 text-sm" />
      <datalist id="expense-cats">
        {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} />)}
      </datalist>
      <datalist id="expense-cats-edit">
        {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} />)}
      </datalist>
      <Input placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 text-sm" />
      <div className="flex gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm" />
        <Input type="number" min="0" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-sm w-32" />
      </div>
      <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="h-9 text-sm">
        {PAYMENT_METHODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" onClick={submit} disabled={isPending}>
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Agregar gasto
      </Button>
    </div>
  )
}

export function ExpensesManager({ month, expenses, onChanged, showForm = true }: { month: string; expenses: Expense[]; onChanged: () => void; showForm?: boolean }) {
  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  return (
    <div>
      {showForm && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
            <Wallet className="size-4" /> Registrar gasto
          </h2>
          <AddExpenseForm month={month} onAdded={onChanged} />
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Wallet className="size-4" /> Gastos del mes ({expenses.length})
        </h2>
        <span className="text-sm font-bold text-destructive">−{formatCLP(total)}</span>
      </div>
      <div className="space-y-2">
        {expenses.length === 0 && <p className="text-sm text-muted-foreground">Sin gastos registrados este mes.</p>}
        {expenses.map((e) => <ExpenseRow key={e.id} expense={e} onChanged={onChanged} />)}
      </div>
    </div>
  )
}
