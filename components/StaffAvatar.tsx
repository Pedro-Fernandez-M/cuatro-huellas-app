import { UserRound } from 'lucide-react'

/**
 * Avatar circular de una funcionaria: muestra la foto si existe, y si no un
 * placeholder con sus iniciales. Pensado para dejar el "hueco" de la foto listo
 * antes de tener las imágenes reales.
 */
export function StaffAvatar({
  name,
  photoUrl,
  size = 64,
}: {
  name: string
  photoUrl?: string | null
  size?: number
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  return (
    <div
      className="relative rounded-full overflow-hidden shrink-0 border-2 border-card shadow-sm bg-primary/10 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : initials ? (
        <span className="font-black text-primary" style={{ fontSize: size * 0.34 }}>{initials}</span>
      ) : (
        <UserRound className="text-primary" style={{ width: size * 0.5, height: size * 0.5 }} />
      )}
    </div>
  )
}
