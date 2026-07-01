'use client'

import { useState, useTransition } from 'react'
import { Plus, Minus, Package, History, Loader2, Trash2 } from 'lucide-react'
import type { InventoryProduct, InventoryMovement } from '@/types'
import { adjustStock, createProduct, deleteProduct } from '@/actions/inventory'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

function ProductRow({ product }: { product: InventoryProduct }) {
  const [open, setOpen] = useState<'in' | 'out' | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  function submit(type: 'in' | 'out') {
    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setError('Cantidad inválida')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await adjustStock(product.id, type, qty, note || undefined)
      if (result.success) {
        setOpen(null)
        setQuantity('1')
        setNote('')
      } else {
        setError(result.error ?? 'Error')
      }
    })
  }

  function remove() {
    setError(null)
    startTransition(async () => {
      const result = await deleteProduct(product.id)
      if (!result.success) {
        setError(result.error ?? 'No se pudo eliminar')
        setConfirmDelete(false)
      }
    })
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-sm">{product.display_name}</p>
          <p className="text-xs text-muted-foreground">{product.current_stock} {product.unit}</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => { setOpen(open === 'in' ? null : 'in'); setConfirmDelete(false) }}
            className="size-8 rounded-lg border border-border hover:border-primary/50 flex items-center justify-center transition-colors"
            title="Registrar entrada"
          >
            <Plus className="size-4 text-primary" />
          </button>
          <button
            onClick={() => { setOpen(open === 'out' ? null : 'out'); setConfirmDelete(false) }}
            className="size-8 rounded-lg border border-border hover:border-destructive/50 flex items-center justify-center transition-colors"
            title="Registrar salida"
          >
            <Minus className="size-4 text-destructive" />
          </button>
          <button
            onClick={() => { setConfirmDelete(true); setOpen(null) }}
            className="size-8 rounded-lg border border-border hover:border-destructive/50 flex items-center justify-center transition-colors"
            title="Eliminar producto"
          >
            <Trash2 className="size-4 text-destructive" />
          </button>
        </div>
      </div>
      {confirmDelete && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            ¿Eliminar <strong>{product.display_name}</strong>? Se borrará también su historial de movimientos.
          </p>
          {error && <p className="text-xs text-destructive mb-2">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" disabled={isPending} onClick={remove}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Sí, eliminar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          </div>
        </div>
      )}
      {open && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <div className="flex gap-2">
            <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-24" />
            <Input placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button size="sm" disabled={isPending} onClick={() => submit(open)}>
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : open === 'in' ? 'Registrar entrada' : 'Registrar salida'}
          </Button>
        </div>
      )}
    </div>
  )
}

function AddProductForm({ categories }: { categories: string[] }) {
  const [category, setCategory] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [initialStock, setInitialStock] = useState('0')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function submit() {
    if (!displayName.trim()) {
      setError('Ingresa el nombre del producto')
      return
    }
    if (!category.trim()) {
      setError('Ingresa o elige una categoría')
      return
    }
    setError(null)
    setDone(false)
    startTransition(async () => {
      const result = await createProduct(category.trim(), displayName.trim(), undefined, Number(initialStock) || 0)
      if (result.success) {
        setDisplayName('')
        setInitialStock('0')
        setDone(true)
      } else setError(result.error ?? 'Error')
    })
  }

  return (
    <div className="p-4 rounded-xl border border-dashed border-border space-y-2">
      <div>
        <Input
          list="inventory-categories"
          placeholder="Categoría (ej: Shampoo, Accesorios, Medicamentos...)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="inventory-categories">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
        <p className="text-[11px] text-muted-foreground mt-1">Escribe una categoría nueva o elige una existente.</p>
      </div>
      <Input placeholder="Nombre del producto" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <Input type="number" min="0" placeholder="Stock inicial" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {done && <p className="text-xs text-primary">Producto agregado ✓</p>}
      <Button size="sm" onClick={submit} disabled={isPending}>
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Agregar producto
      </Button>
    </div>
  )
}

export default function InventoryManager({
  initialProducts,
  initialMovements,
}: {
  initialProducts: InventoryProduct[]
  initialMovements: InventoryMovement[]
}) {
  const grouped = initialProducts.reduce<Record<string, InventoryProduct[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p)
    return acc
  }, {})
  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no hay productos. Agrega el primero a la derecha.</p>
        )}
        {categories.map((category) => (
          <div key={category}>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Package className="size-4" /> {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grouped[category].map((p) => <ProductRow key={p.id} product={p} />)}
            </div>
          </div>
        ))}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Agregar producto nuevo</h2>
          <AddProductForm categories={categories} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <History className="size-4" /> Movimientos recientes
        </h2>
        <div className="space-y-2">
          {initialMovements.length === 0 && <p className="text-sm text-muted-foreground">Sin movimientos aún.</p>}
          {initialMovements.map((m) => (
            <div key={m.id} className="p-3 rounded-lg border border-border bg-card text-sm">
              <p className="font-medium">
                {m.product?.display_name ?? 'Producto'} <span className={m.movement_type === 'in' ? 'text-primary' : 'text-destructive'}>{m.movement_type === 'in' ? '+' : '-'}{m.quantity}</span>
              </p>
              <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString('es-CL')}</p>
              {m.note && <p className="text-xs text-muted-foreground mt-1">{m.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
