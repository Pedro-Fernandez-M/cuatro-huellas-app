import { TriangleAlert } from 'lucide-react'
import PushManager from '@/components/admin/PushManager'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Notificaciones' }

export default function NotificacionesPage() {
  // Se lee en el servidor (no inline en el bundle) para que agregar la variable
  // en Vercel no obligue a rehacer el build.
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? ''

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-2">Notificaciones</h1>
      <p className="text-muted-foreground mb-8">
        Recibe un aviso en el celular apenas entra una reserva nueva desde la web.
      </p>

      {vapidPublicKey ? (
        <PushManager vapidPublicKey={vapidPublicKey} />
      ) : (
        <div className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-card">
          <TriangleAlert className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold mb-1">Falta configurar las llaves de notificación</p>
            <p className="text-muted-foreground">
              Agrega <code className="font-mono">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> y{' '}
              <code className="font-mono">VAPID_PRIVATE_KEY</code> a las variables de
              entorno del proyecto en Vercel y vuelve a desplegar.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
