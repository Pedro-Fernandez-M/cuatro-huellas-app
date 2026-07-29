'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, Check, Megaphone, CalendarClock } from 'lucide-react'
import type { Offer } from '@/types'
import { addOffer, updateOffer, deleteOffer } from '@/actions/offers'
import { formatDateLong, todayInShopTz } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** true si la oferta tiene fecha de vencimiento ya pasada. */
function isExpired(expiresAt: string | null): boolean {
  return !!expiresAt && expiresAt < todayInShopTz()
}

const EMOJI_CHOICES = ['🎉', '🎲', '🐾', '🎁', '💥', '⭐', '🔥', '💙', '✂️', '🛁']

// ─── Interruptor activar / desactivar ───────────────────────
function ActiveToggle({ active, onToggle, disabled }: { active: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      title={active ? 'Está visible en la web — clic para ocultar' : 'Oculta — clic para mostrar en la web'}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${active ? 'bg-primary' : 'bg-muted-foreground/30'} disabled:opacity-50`}
    >
      <span className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

// ─── Oferta (fila editable) ─────────────────────────────────
function OfferRow({ offer }: { offer: Offer }) {
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState(offer.message)
  const [emoji, setEmoji] = useState(offer.emoji)
  const [expiresAt, setExpiresAt] = useState(offer.expires_at ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const expired = isExpired(offer.expires_at)

  function save() {
    if (!message.trim()) return
    startTransition(async () => {
      await updateOffer(offer.id, { message: message.trim(), emoji: emoji || '🎉', expires_at: expiresAt || null })
      setEditing(false)
      router.refresh()
    })
  }

  function toggleActive() {
    startTransition(async () => {
      await updateOffer(offer.id, { active: !offer.active })
      router.refresh()
    })
  }

  function remove() {
    startTransition(async () => {
      await deleteOffer(offer.id)
      router.refresh()
    })
  }

  return (
    <div className={`p-4 rounded-xl border bg-card ${offer.active ? 'border-primary/40' : 'border-border/60'}`}>
      {!editing ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-3">
            <span className="text-2xl leading-none">{offer.emoji}</span>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{offer.message}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                {offer.active && expired ? (
                  <span className="text-[11px] font-medium text-destructive">● Vencida (no se muestra)</span>
                ) : (
                  <span className={`text-[11px] font-medium ${offer.active ? 'text-primary' : 'text-muted-foreground'}`}>
                    {offer.active ? '● Visible en la web' : '○ Oculta'}
                  </span>
                )}
                {offer.expires_at && (
                  <span className={`inline-flex items-center gap-1 text-[11px] ${expired ? 'text-destructive' : 'text-muted-foreground'}`}>
                    <CalendarClock className="size-3" /> Vence {formatDateLong(offer.expires_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ActiveToggle active={offer.active} onToggle={toggleActive} disabled={isPending} />
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Editar">
              <Pencil className="size-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Eliminar">
              <Trash2 className="size-3.5 text-destructive" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1.5">Emoji</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`size-9 rounded-lg text-lg transition-colors ${emoji === e ? 'bg-primary/15 ring-1 ring-primary' : 'hover:bg-secondary'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1.5">Mensaje</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Ej: Solo Agosto, solicita tu 5% de descuento"
              className="w-full px-3 py-2 rounded-lg border border-border bg-input/60 text-sm focus:border-primary outline-none resize-none"
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5">Vence el (opcional)</Label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={expiresAt}
                min={todayInShopTz()}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-input/60 text-sm focus:border-primary outline-none"
              />
              {expiresAt && (
                <button onClick={() => setExpiresAt('')} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Quitar fecha</button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Déjalo vacío para que la oferta no venza. Se ocultará sola el día después de esta fecha.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={isPending}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setMessage(offer.message); setEmoji(offer.emoji); setExpiresAt(offer.expires_at ?? '') }}>Cancelar</Button>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">¿Eliminar esta oferta?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={remove} disabled={isPending}>Sí, eliminar</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Formulario nueva oferta ────────────────────────────────
function AddOfferForm() {
  const [message, setMessage] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    if (!message.trim()) { setError('Escribe el mensaje'); return }
    setError(null)
    startTransition(async () => {
      const r = await addOffer({ message, emoji, expires_at: expiresAt || null })
      if (r.success) { setMessage(''); setEmoji('🎉'); setExpiresAt(''); router.refresh() }
      else setError(r.error ?? 'Error')
    })
  }

  return (
    <div className="p-4 rounded-xl border border-dashed border-border space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2"><Plus className="size-4" /> Nueva oferta</p>
      <div>
        <Label className="text-xs mb-1.5">Emoji</Label>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`size-9 rounded-lg text-lg transition-colors ${emoji === e ? 'bg-primary/15 ring-1 ring-primary' : 'hover:bg-secondary'}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1.5">Mensaje</Label>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ej: ¡Ven a tirar los dados por tu descuento!"
          className="h-9 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs mb-1.5">Vence el (opcional)</Label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={expiresAt}
            min={todayInShopTz()}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-input/60 text-sm focus:border-primary outline-none"
          />
          {expiresAt && (
            <button onClick={() => setExpiresAt('')} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Quitar</button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">Vacío = no vence. Se ocultará sola el día después de esta fecha.</p>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" onClick={submit} disabled={isPending}>
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Crear oferta
      </Button>
      <p className="text-[11px] text-muted-foreground">La oferta nace oculta. Actívala con el interruptor cuando quieras que aparezca en la web.</p>
    </div>
  )
}

export default function OffersManager({ offers }: { offers: Offer[] }) {
  const activeCount = offers.filter((o) => o.active).length
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-start gap-3">
        <Megaphone className="size-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Crea tus promociones y actívalas cuando quieras. Solo las ofertas con el interruptor
          encendido aparecen en la web.{' '}
          {activeCount > 0
            ? <span className="text-primary font-medium">{activeCount} activa{activeCount > 1 ? 's' : ''} ahora.</span>
            : <span className="font-medium">Ninguna visible ahora.</span>}
        </p>
      </div>

      {offers.length > 0 && (
        <div className="space-y-2.5">
          {offers.map((o) => <OfferRow key={o.id} offer={o} />)}
        </div>
      )}

      <AddOfferForm />
    </div>
  )
}
