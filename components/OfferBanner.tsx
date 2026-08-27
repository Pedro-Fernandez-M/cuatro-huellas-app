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
    <div className="gradient-warm text-primary-foreground shadow-lg">
      <div className="max-w-5xl mx-auto divide-y divide-white/20">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href="/reservar"
            className="flex items-center justify-center gap-3 sm:gap-4 px-4 py-6 sm:py-8 text-center font-black hover:opacity-90 transition-opacity"
          >
            <span className="text-3xl sm:text-5xl leading-none shrink-0">{offer.emoji}</span>
            <span className="text-xl sm:text-3xl md:text-4xl leading-tight tracking-tight">{offer.message}</span>
            <Sparkles className="size-6 sm:size-8 shrink-0 opacity-80" />
          </Link>
        ))}
      </div>
    </div>
  )
}
