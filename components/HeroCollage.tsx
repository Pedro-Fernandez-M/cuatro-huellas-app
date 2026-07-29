/**
 * Fondo del hero: collage de fotos reales de perritos que se desplazan
 * verticalmente en columnas (efecto parallax suave). Puramente decorativo,
 * por eso va con aria-hidden. Las fotos viven en /public/collage/.
 */

const IMAGES = Array.from({ length: 21 }, (_, i) => `/collage/${i + 1}.jpg`)

const COLUMNS = 6
// Reparte las fotos en columnas (round-robin) para variar el mosaico
const columns = Array.from({ length: COLUMNS }, (_, c) =>
  IMAGES.filter((_, i) => i % COLUMNS === c),
)

// Ritmo distinto por columna → sensación de profundidad
const DURATIONS = [42, 52, 38, 56, 46, 50]
// Clases responsive: 3 columnas en móvil, 4 en tablet, 6 en desktop
const VISIBILITY = ['', '', '', 'hidden sm:flex', 'hidden lg:flex', 'hidden lg:flex']

export function HeroCollage() {
  return (
    <div className="absolute inset-0 flex gap-3 overflow-hidden" aria-hidden="true">
      {columns.map((col, ci) => {
        const loop = [...col, ...col] // duplicado para bucle continuo
        return (
          <div key={ci} className={`flex-1 min-w-0 ${VISIBILITY[ci]}`}>
            <div
              className="collage-track flex flex-col gap-3"
              style={{
                animationDuration: `${DURATIONS[ci]}s`,
                animationDirection: ci % 2 === 0 ? 'normal' : 'reverse',
              }}
            >
              {loop.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-[3/4] object-cover rounded-2xl shadow-sm"
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
