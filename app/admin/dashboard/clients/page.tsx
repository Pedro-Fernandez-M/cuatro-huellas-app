import Link from 'next/link'
import { Search, Users, Phone, Dog } from 'lucide-react'
import { listClients } from '@/actions/clients'
import { sizeLabel } from '@/lib/constants/sizes'

export const dynamic = 'force-dynamic'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const clients = await listClients(q)

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Clientes</h1>
      <p className="text-sm text-muted-foreground mb-6">Dueños y sus mascotas registradas</p>

      <form className="mb-8 max-w-sm">
        <div className="relative">
          <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Buscar por nombre o teléfono"
            className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-border bg-input/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>
      </form>

      {clients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Users className="size-10 mx-auto mb-3 opacity-30" />
          <p>No se encontraron clientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/admin/dashboard/clients/${c.id}`}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all"
            >
              <p className="font-semibold text-sm mb-1">{c.owner_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                <Phone className="size-3 text-primary" /> {c.owner_phone}
              </p>
              {c.pets.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {c.pets.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-xs">
                      <Dog className="size-3 text-primary" /> {p.name} · {sizeLabel(p.size_category)}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
