import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import type { Offer } from '@/types'

/**
 * Barra de ofertas del sitio público. Solo se renderiza si el admin tiene
 * al menos una oferta activa. Cada oferta enlaza a la reserva.
 */
export function OfferBanner({ offers }: { offers: Offer[] }) {
  if (!offers || offers.length === 0) return null

  return (
    <div className="gradient-warm text-primary-foreground">
      <div className="max-w-5xl mx-auto divide-y divide-white/15">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href="/reservar"
            className="flex items-center justify-center gap-2.5 px-4 py-2.5 text-center text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="text-base leading-none">{offer.emoji}</span>
            <span>{offer.message}</span>
            <Sparkles className="size-3.5 shrink-0 opacity-80" />
          </Link>
        ))}
      </div>
    </div>
  )
}
