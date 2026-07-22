'use client'

import { useState } from 'react'
import { MessageCircle, Check, ChevronRight, RotateCcw } from 'lucide-react'
import type { Appointment } from '@/types'
import { waLink, buildReminderMessage } from '@/lib/whatsapp'

/**
 * Envío guiado de todos los recordatorios del día. Abre WhatsApp de a uno
 * (un toque cada vez) porque los navegadores bloquean abrir varias ventanas
 * a la vez y en cada chat hay que apretar "enviar" manualmente.
 */
export function SendAllReminders({ appointments }: { appointments: Appointment[] }) {
  const items = appointments.map((a) => ({
    name: a.owner_name,
    pet: a.pet_name,
    href: waLink(a.owner_phone, buildReminderMessage(a)),
  }))
  const [idx, setIdx] = useState(0)

  if (items.length === 0) return null

  const done = idx >= items.length
  const next = items[idx]

  function openNext() {
    if (done) return
    window.open(next.href, '_blank', 'noopener,noreferrer')
    setIdx((i) => i + 1)
  }

  return (
    <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-sm flex items-center gap-1.5">
            <MessageCircle className="size-4 text-primary" /> Enviar recordatorios ({items.length})
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {done
              ? '¡Listo! Se abrieron todos los recordatorios.'
              : idx === 0
                ? 'Un toque abre el primer WhatsApp; al volver, aprieta “siguiente”.'
                : `Enviados ${idx} de ${items.length}. Continúa con el siguiente.`}
          </p>
        </div>

        {!done ? (
          <button
            onClick={openNext}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl font-bold text-white transition-all hover:opacity-90 shrink-0"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle className="size-4" />
            {idx === 0 ? 'Enviar todos' : `Siguiente: ${next.pet}`}
            <ChevronRight className="size-4" />
          </button>
        ) : (
          <button
            onClick={() => setIdx(0)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/60 transition-all shrink-0"
          >
            <RotateCcw className="size-4" /> Reiniciar
          </button>
        )}
      </div>

      {/* Progreso */}
      <div className="flex items-center gap-1.5 mt-3">
        {items.map((it, i) => (
          <div
            key={i}
            title={`${it.pet} · ${it.name}`}
            className={`h-1.5 flex-1 rounded-full ${i < idx ? 'bg-primary' : 'bg-secondary'}`}
          />
        ))}
      </div>

      {done && (
        <p className="text-xs text-primary flex items-center gap-1.5 mt-2">
          <Check className="size-3.5" /> Recuerda apretar “enviar” en cada chat de WhatsApp.
        </p>
      )}
    </div>
  )
}
