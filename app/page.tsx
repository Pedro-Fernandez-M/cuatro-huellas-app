import Link from 'next/link'
import {
  Scissors, Droplets, Sparkles, Clock, ShieldCheck,
  CalendarCheck, ChevronRight, MapPin, Dog, Heart, PawPrint,
} from 'lucide-react'
import { SERVICES } from '@/lib/constants/services'
import { SIZES } from '@/lib/constants/sizes'
import { Logo } from '@/components/Logo'
import { GalleryImage } from '@/components/GalleryImage'

function IgIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

const INSTAGRAM_URL = 'https://www.instagram.com/cuatro.huellas.valdivia/'
const INSTAGRAM_HANDLE = '@cuatro.huellas.valdivia'

const SERVICE_ICONS = { bano_mantencion: Droplets, servicio_completo: Scissors, bano_comercial: Sparkles }

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-black text-lg tracking-tight">
            <Logo size={40} />
            Cuatro Huellas
          </Link>
          <Link
            href="/reservar"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-warm text-primary-foreground text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20"
          >
            Reservar
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          {/* Blobs de color cálidos */}
          <div
            className="absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, oklch(0.82 0.08 165 / 0.45), transparent 70%)' }}
          />
          <div
            className="absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, oklch(0.72 0.13 68 / 0.28), transparent 70%)' }}
          />
          {/* Huellas decorativas */}
          <PawPrint className="hidden sm:block absolute top-16 left-10 size-8 text-primary/10 -rotate-12" />
          <PawPrint className="hidden sm:block absolute bottom-20 right-16 size-10 text-primary/10 rotate-12" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold mb-6 uppercase tracking-wider">
                <Heart className="size-3.5 fill-primary" />
                Cuidamos a tu peludo con cariño
              </div>
              <h1 className="text-[clamp(2.3rem,6vw,4rem)] font-black tracking-tight leading-[1.05] mb-5">
                Tu mascota,<br />
                <span className="text-gradient-warm">feliz y regalona</span> 🐶
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Peluquería canina en Valdivia. Baño, corte y mucho amor para tu perro.
                Reserva tu hora online en minutos — sin llamadas y sin abono.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/reservar"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl gradient-warm text-primary-foreground font-bold text-base hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-xl shadow-primary/20"
                >
                  <CalendarCheck className="size-5" />
                  Reservar hora ahora
                </Link>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl border border-border text-foreground font-semibold text-base hover:bg-secondary/60 transition-all"
                >
                  <IgIcon className="size-5" />
                  Ver Instagram
                </a>
              </div>
            </div>

            {/* Collage de fotos */}
            <div className="relative h-[340px] sm:h-[400px] hidden lg:block">
              <div className="absolute top-0 right-4 w-52 h-64 rounded-3xl overflow-hidden border-4 border-card shadow-xl rotate-3">
                <GalleryImage src="/galeria/1.jpg" alt="Perrito recién bañado en Cuatro Huellas" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-2 left-0 w-44 h-56 rounded-3xl overflow-hidden border-4 border-card shadow-xl -rotate-6">
                <GalleryImage src="/galeria/2.jpg" alt="Perro peluqueado en Cuatro Huellas" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-16 right-0 w-36 h-36 rounded-3xl overflow-hidden border-4 border-card shadow-xl rotate-6">
                <GalleryImage src="/galeria/3.jpg" alt="Mascota feliz en Cuatro Huellas" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-24 -left-2 bg-card rounded-2xl shadow-lg border border-border px-4 py-3 -rotate-3">
                <p className="text-xs font-bold flex items-center gap-1.5"><PawPrint className="size-4 text-primary" /> +cientos de peludos</p>
                <p className="text-[11px] text-muted-foreground">felices y regalones</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SERVICIOS ═══ */}
        <section id="servicios" className="py-20 border-t border-border bg-card/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 text-center">Nuestros servicios</h2>
            <p className="text-muted-foreground text-center mb-12">Elige el que necesita tu peludo</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              {SERVICES.map((service) => {
                const Icon = SERVICE_ICONS[service.id]
                return (
                  <div key={service.id} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all">
                    <div className="p-3 rounded-xl bg-primary/10 inline-flex mb-5">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-base mb-2">{service.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                  </div>
                )
              })}
            </div>
            <div className="text-center">
              <Link href="/reservar" className="inline-flex items-center gap-2 text-primary font-bold hover:opacity-80 transition-opacity">
                Reservar mi hora <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ TAMAÑOS ═══ */}
        <section className="py-20 border-t border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 text-center">Según el tamaño</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
              Perros grandes y extra grandes solo se agendan durante la mañana, ya que su servicio
              toma más tiempo.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {SIZES.map((size) => (
                <div key={size.id} className="p-5 rounded-2xl border border-border bg-card text-center">
                  <Dog className="size-6 text-primary mx-auto mb-3" />
                  <p className="font-bold text-sm mb-1">{size.label}</p>
                  <p className="text-xs text-muted-foreground">{size.weightRange}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CÓMO FUNCIONA ═══ */}
        <section className="py-20 border-t border-border bg-card/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-12 text-center">¿Cómo funciona?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Scissors, title: 'Elige el servicio', desc: 'Baño con mantención, servicio completo o baño comercial' },
                { icon: Dog, title: 'Indica el tamaño', desc: 'Pequeña, mediana, grande o extra grande' },
                { icon: Clock, title: 'Elige tu horario', desc: 'Escoge el día y hora disponible' },
                { icon: CalendarCheck, title: 'Confirma y listo', desc: 'Solo tus datos y los de tu mascota — sin abono' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center sm:text-left">
                  <div className="p-3 rounded-xl bg-primary/10 inline-flex mb-4">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-14">
              <Link
                href="/reservar"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl gradient-warm text-primary-foreground font-bold hover:opacity-90 transition-all"
              >
                <CalendarCheck className="size-5" />
                Reservar mi hora
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ GALERÍA (Instagram) ═══ */}
        <section id="galeria" className="py-20 border-t border-border bg-card/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-[10px] tracking-[0.3em] text-primary uppercase font-bold mb-3">— Nuestros peludos</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Galería 🐾</h2>
              <p className="text-muted-foreground">Algunos de los engreídos que pasaron por el local</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <a
                  key={n}
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-all"
                >
                  <GalleryImage src={`/galeria/${n}.jpg`} alt={`Mascota atendida en Cuatro Huellas ${n}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                    <IgIcon className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                  </div>
                </a>
              ))}
            </div>

            <div className="text-center">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl border border-primary/30 bg-primary/5 text-primary font-bold hover:bg-primary/10 transition-all text-sm"
              >
                <IgIcon className="size-4" />
                Ver más en {INSTAGRAM_HANDLE}
              </a>
            </div>
          </div>
        </section>

        {/* ═══ CONFIANZA ═══ */}
        <section className="py-16 border-t border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: ShieldCheck, label: 'Máximo 3 perros a la vez', desc: 'Atención tranquila, sin aglomeración' },
              { icon: CalendarCheck, label: 'Sin abono', desc: 'Reserva directa, sin pagos por adelantado' },
              { icon: Clock, label: 'Confirmación inmediata', desc: 'Tu hora queda agendada al instante' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label}>
                <Icon className="size-6 text-primary mx-auto mb-3" />
                <p className="font-bold text-sm mb-1">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ UBICACIÓN ═══ */}
        <section id="ubicacion" className="py-20 border-t border-border bg-card/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Info */}
              <div>
                <p className="text-[10px] tracking-[0.3em] text-primary uppercase font-bold mb-3">— Dónde encontrarnos</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-8">Visítanos</h2>

                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-primary/10 shrink-0 mt-0.5">
                    <MapPin className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1">Dirección</p>
                    <p className="text-muted-foreground">Rubén Darío 146</p>
                    <p className="text-muted-foreground">Valdivia, Los Ríos, Chile</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-8">
                  <div className="p-3 rounded-xl bg-primary/10 shrink-0 mt-0.5">
                    <IgIcon className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1">Instagram</p>
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:opacity-70 transition-opacity font-medium">
                      {INSTAGRAM_HANDLE}
                    </a>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://www.google.com/maps/place/Peluquer%C3%ADa+canina+Cuatro+Huellas/@-39.8383781,-73.2105795,17z/data=!4m6!3m5!1s0x9615ef4ca33e0459:0xabbc760dd824014c!8m2!3d-39.838373!4d-73.2105635!16s%2Fg%2F11ph3b8_ms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl gradient-warm text-primary-foreground font-bold hover:opacity-90 transition-all text-sm"
                  >
                    <MapPin className="size-4" />
                    Cómo llegar
                  </a>
                  <Link
                    href="/reservar"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl border border-border font-semibold hover:bg-secondary/60 transition-all text-sm"
                  >
                    <CalendarCheck className="size-4" />
                    Reservar hora
                  </Link>
                </div>
              </div>

              {/* Mapa */}
              <div className="rounded-2xl overflow-hidden border border-border shadow-lg aspect-[4/3] lg:aspect-auto lg:h-[380px]">
                <iframe
                  src="https://maps.google.com/maps?q=Peluquer%C3%ADa%20canina%20Cuatro%20Huellas%2C%20Rub%C3%A9n%20Dar%C3%ADo%20146%2C%20Valdivia&z=17&output=embed"
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Peluquería canina Cuatro Huellas — Rubén Darío 146, Valdivia"
                />
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 font-bold text-foreground">
            <Logo size={28} /> Cuatro Huellas
          </span>
          <div className="flex items-center gap-6">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <IgIcon className="size-3.5" /> Instagram
            </a>
            <Link href="/admin/login" className="hover:text-foreground transition-colors">
              Staff
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Cuatro Huellas</p>
        </div>
      </footer>
    </div>
  )
}
