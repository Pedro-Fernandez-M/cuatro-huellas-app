'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 h-10 px-4 rounded-xl gradient-warm text-primary-foreground text-sm font-bold hover:opacity-90 transition-all"
    >
      <Printer className="size-4" /> Imprimir / Guardar PDF
    </button>
  )
}
