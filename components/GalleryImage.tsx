'use client'

import { useState } from 'react'
import { PawPrint } from 'lucide-react'

/**
 * Muestra una foto desde /public. Si el archivo no existe todavía,
 * en vez de una imagen rota muestra un marcador cálido con una huella.
 * Así puedes ir soltando fotos de a poco en public/galeria/.
 */
export function GalleryImage({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-secondary text-primary/40 ${className}`}>
        <PawPrint className="size-8" />
        <span className="text-[10px] font-semibold tracking-wide">Cuatro Huellas</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
