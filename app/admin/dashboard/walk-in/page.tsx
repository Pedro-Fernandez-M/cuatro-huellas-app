import WalkInForm from '@/components/admin/WalkInForm'

export default function WalkInPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black tracking-tight mb-1">Ingreso manual</h1>
      <p className="text-sm text-muted-foreground mb-8">Para clientes que llegan sin reserva previa</p>
      <WalkInForm />
    </div>
  )
}
