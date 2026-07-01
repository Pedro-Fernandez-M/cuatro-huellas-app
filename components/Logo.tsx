import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Logo de Cuatro Huellas. Usa el archivo public/logo.jpg.
 */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Cuatro Huellas — Peluquería Canina"
      width={size}
      height={size}
      priority
      className={cn('rounded-full object-contain', className)}
    />
  )
}
