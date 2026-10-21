import { DatabaseBackup, Mail, ShieldCheck } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/roles'
import BackupButton from '@/components/admin/BackupButton'

export const dynamic = 'force-dynamic'

export default async function RespaldosPage() {
  await requireAdmin()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black tracking-tight mb-1">Respaldos</h1>
      <p className="text-sm text-muted-foreground mb-8">Guarda una copia de toda la base de datos (clientes, citas, mascotas, etc.).</p>

      <div className="p-5 rounded-2xl border border-border bg-card mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 shrink-0"><DatabaseBackup className="size-5 text-primary" /></div>
          <div>
            <h2 className="font-bold">Descargar ahora</h2>
            <p className="text-sm text-muted-foreground">Baja un archivo con toda la información a tu computador o teléfono.</p>
          </div>
        </div>
        <BackupButton />
      </div>

      <div className="p-5 rounded-2xl border border-border bg-secondary/40 space-y-3 text-sm">
        <p className="flex items-center gap-2 font-semibold"><Mail className="size-4 text-primary" /> Respaldo automático por correo</p>
        <p className="text-muted-foreground">
          Todos los días se genera un respaldo y, si está configurado el correo, se envía solo. Esa misma
          rutina diaria mantiene la base de datos activa para que nunca se pause por inactividad.
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="size-4 text-primary shrink-0" /> El archivo contiene datos de clientes: guárdalo en un lugar seguro.
        </p>
      </div>
    </div>
  )
}
