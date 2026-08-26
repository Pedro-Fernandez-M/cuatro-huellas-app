'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Bell, BellOff, BellRing, Check, Loader2, Smartphone, Trash2, TriangleAlert, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  listMyPushDevices, savePushSubscription, removePushSubscription, sendTestPush,
  type PushDevice,
} from '@/actions/push'

/** La llave pública VAPID viaja en base64url; el navegador la pide como bytes. */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/** Nombre por defecto para el dispositivo, deducido del navegador. */
function guessDeviceName() {
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'Celular Android'
  if (/iPhone|iPad/i.test(ua)) return 'iPhone'
  if (/Windows/i.test(ua)) return 'Computador'
  if (/Mac/i.test(ua)) return 'Mac'
  return 'Este dispositivo'
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Feedback = { kind: 'ok' | 'error'; text: string } | null

/** Registra el service worker y devuelve el endpoint ya suscrito, si lo hay. */
async function registerServiceWorker(): Promise<string | null> {
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await reg.pushManager.getSubscription()
    return sub?.endpoint ?? null
  } catch {
    return null
  }
}

/** Pasos para agregar el panel a la pantalla de inicio en iPhone. */
function IOSSteps() {
  return (
    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside marker:font-bold marker:text-primary">
      <li>Abre este panel en <strong>Safari</strong> (no sirve desde Chrome ni desde otra app).</li>
      <li>Toca el botón <strong>Compartir</strong>, el cuadrado con la flecha hacia arriba.</li>
      <li>Baja en la lista y elige <strong>Agregar a inicio</strong>.</li>
      <li>Toca <strong>Agregar</strong> arriba a la derecha.</li>
      <li>Abre el ícono nuevo desde la pantalla de inicio e inicia sesión ahí dentro.</li>
    </ol>
  )
}

function IOSInstallSteps() {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <div className="flex items-start gap-3 mb-4">
        <Smartphone className="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">Primero instala el panel en el iPhone</p>
          <p className="text-sm text-muted-foreground">
            En iPhone las notificaciones solo funcionan con la app agregada a la
            pantalla de inicio; desde una pestaña de Safari no se pueden activar.
            Necesitas iOS 16.4 o más nuevo.
          </p>
        </div>
      </div>
      <IOSSteps />
      <p className="text-sm text-muted-foreground mt-4">
        Cuando la abras desde el ícono, vuelve a esta página y va a aparecer el botón
        para activar los avisos.
      </p>
    </div>
  )
}

export default function PushManager({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [supported, setSupported] = useState<boolean | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [thisEndpoint, setThisEndpoint] = useState<string | null>(null)
  const [devices, setDevices] = useState<PushDevice[]>([])
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  const refreshDevices = useCallback(async () => {
    setDevices(await listMyPushDevices())
  }, [])

  useEffect(() => {
    let alive = true

    // Todo el arranque va en una función async y el estado se aplica de una
    // sola vez al final: así se evita una cascada de renders y el componente
    // no parpadea entre "cargando" y el estado real.
    async function bootstrap() {
      const ok =
        'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

      const endpoint = ok ? await registerServiceWorker() : null
      const list = ok ? await listMyPushDevices() : []
      if (!alive) return

      // En iOS estos datos hacen falta aunque el push no esté disponible: es lo
      // que decide si mostramos las instrucciones de "Agregar a inicio".
      setIsIOS(isIOSDevice())
      setInstalled(
        window.matchMedia('(display-mode: standalone)').matches ||
        // Safari en iOS no implementa display-mode, usa su propia bandera.
        ('standalone' in navigator && Boolean((navigator as { standalone?: boolean }).standalone))
      )
      setSupported(ok)
      if (!ok) return

      setPermission(Notification.permission)
      setLabel(guessDeviceName())
      setThisEndpoint(endpoint)
      setDevices(list)
    }

    bootstrap()

    const onInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    return () => {
      alive = false
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
    }
  }, [])

  async function enable() {
    setBusy(true)
    setFeedback(null)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setFeedback({
          kind: 'error',
          text: perm === 'denied'
            ? 'Bloqueaste las notificaciones para este sitio. Actívalas desde los ajustes del navegador y vuelve a intentar.'
            : 'No se concedió el permiso.',
        })
        return
      }

      const reg = await navigator.serviceWorker.ready
      // Si ya existía una suscripción (por ejemplo con otras llaves VAPID), se
      // descarta antes de crear la nueva: si no, subscribe() falla.
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const plain = JSON.parse(JSON.stringify(sub)) as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }
      const result = await savePushSubscription(plain, label)
      if (!result.success) {
        await sub.unsubscribe()
        setFeedback({ kind: 'error', text: result.error ?? 'No se pudo guardar.' })
        return
      }

      setThisEndpoint(sub.endpoint)
      await refreshDevices()
      setFeedback({ kind: 'ok', text: 'Listo. Este dispositivo va a recibir los avisos.' })
    } catch (err) {
      setFeedback({ kind: 'error', text: 'No se pudo activar: ' + (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function disable(endpoint: string) {
    setBusy(true)
    setFeedback(null)
    try {
      // Si el que se quita es este mismo dispositivo, también hay que darlo de
      // baja en el navegador; si no, seguiría recibiendo pushes silenciosos.
      if (endpoint === thisEndpoint) {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        setThisEndpoint(null)
      }
      await removePushSubscription(endpoint)
      await refreshDevices()
      setFeedback({ kind: 'ok', text: 'Dispositivo quitado.' })
    } finally {
      setBusy(false)
    }
  }

  async function test() {
    setBusy(true)
    setFeedback(null)
    const result = await sendTestPush()
    setFeedback(
      result.success
        ? { kind: 'ok', text: 'Aviso enviado a ' + result.sent + ' dispositivo(s). Debería llegarte en unos segundos.' }
        : { kind: 'error', text: result.error ?? 'No se pudo enviar.' }
    )
    setBusy(false)
  }

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallEvent(null)
  }

  if (supported === null) {
    return <div className="h-24 rounded-2xl bg-secondary/40 animate-pulse" />
  }

  // iPhone sin instalar: Safari solo expone las notificaciones dentro de la app
  // agregada a la pantalla de inicio, nunca en una pestaña normal. Así que en
  // vez de decir "no soportado" —que es un callejón sin salida— se explica cómo
  // instalarla, que es justo lo que destraba el push.
  if (!supported && isIOS && !installed) {
    return <IOSInstallSteps />
  }

  if (!supported) {
    return (
      <div className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card">
        <TriangleAlert className="size-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Este navegador no soporta notificaciones push. En el celular usa Chrome
          (Android) o Safari con la app agregada a la pantalla de inicio (iPhone).
          En el iPhone hace falta iOS 16.4 o más nuevo.
        </p>
      </div>
    )
  }

  const activeHere = Boolean(thisEndpoint)

  return (
    <div className="space-y-6">

      {/* Instalar como app */}
      {!installed && (
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="flex items-start gap-3 mb-4">
            <Smartphone className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Instalar el panel como app</p>
              <p className="text-sm text-muted-foreground">
                Queda con ícono propio en la pantalla de inicio y se abre directo en la
                agenda, sin barra de navegador.
              </p>
            </div>
          </div>
          {installEvent ? (
            <Button onClick={install}>
              <Download className="size-4" />
              Instalar ahora
            </Button>
          ) : isIOS ? (
            <IOSSteps />
          ) : (
            <p className="text-sm text-muted-foreground">
              En Chrome de Android: menú de tres puntos → <strong>Instalar aplicación</strong>{' '}
              (o &ldquo;Agregar a pantalla de inicio&rdquo;).
            </p>
          )}
        </div>
      )}

      {/* Activar avisos en este dispositivo */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <div className="flex items-start gap-3 mb-4">
          {activeHere
            ? <BellRing className="size-5 text-primary shrink-0 mt-0.5" />
            : <Bell className="size-5 text-muted-foreground shrink-0 mt-0.5" />}
          <div>
            <p className="font-bold mb-1">
              {activeHere ? 'Avisos activados en este dispositivo' : 'Avisos en este dispositivo'}
            </p>
            <p className="text-sm text-muted-foreground">
              Te avisamos cada vez que un cliente reserva una hora por la web, aunque
              tengas el panel cerrado.
            </p>
          </div>
        </div>

        {activeHere ? (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={test} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />}
              Enviar aviso de prueba
            </Button>
            <Button variant="ghost" onClick={() => disable(thisEndpoint!)} disabled={busy}>
              <BellOff className="size-4" />
              Desactivar aquí
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="device-label" className="block text-sm font-semibold mb-1.5">
                Nombre de este dispositivo
              </label>
              <Input
                id="device-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Celular Isabel"
                maxLength={40}
              />
            </div>
            <Button onClick={enable} disabled={busy || permission === 'denied'}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
              Activar avisos
            </Button>
            {permission === 'denied' && (
              <p className="text-sm text-destructive">
                Las notificaciones están bloqueadas para este sitio. Ábrelas en los ajustes
                del navegador (candado en la barra de direcciones → Notificaciones).
              </p>
            )}
          </div>
        )}

        {feedback && (
          <div
            className={`mt-4 flex items-start gap-2 text-sm ${
              feedback.kind === 'ok' ? 'text-primary' : 'text-destructive'
            }`}
          >
            {feedback.kind === 'ok'
              ? <Check className="size-4 shrink-0 mt-0.5" />
              : <TriangleAlert className="size-4 shrink-0 mt-0.5" />}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* Dispositivos registrados */}
      {devices.length > 0 && (
        <div className="p-5 rounded-2xl border border-border bg-card">
          <p className="font-bold mb-4">Dispositivos que reciben avisos</p>
          <ul className="space-y-2">
            {devices.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {d.deviceLabel ?? 'Dispositivo'}
                    {d.endpoint === thisEndpoint && (
                      <span className="ml-2 text-xs font-bold text-primary uppercase tracking-wide">
                        este
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Activado el {new Date(d.createdAt).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <button
                  onClick={() => disable(d.endpoint)}
                  disabled={busy}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
                  aria-label={`Quitar ${d.deviceLabel ?? 'dispositivo'}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
