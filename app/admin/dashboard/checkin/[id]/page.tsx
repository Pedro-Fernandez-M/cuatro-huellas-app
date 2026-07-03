import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getAppointment } from '@/actions/appointments'
import { getPet } from '@/actions/clients'
import { getCatalog } from '@/actions/catalog'
import CheckinManager from '@/components/admin/CheckinManager'

export const dynamic = 'force-dynamic'

export default async function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appointment = await getAppointment(id)
  if (!appointment) notFound()
  const [pet, catalog] = await Promise.all([
    appointment.pet_id ? getPet(appointment.pet_id) : Promise.resolve(null),
    getCatalog(),
  ])

  return (
    <div>
      <Link href="/admin/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit">
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <CheckinManager appointment={appointment} pet={pet} prices={catalog.prices} />
    </div>
  )
}
