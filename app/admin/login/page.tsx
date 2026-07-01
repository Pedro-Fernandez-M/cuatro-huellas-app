'use client'

import { useState, useTransition } from 'react'
import { Loader2, LogIn } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { signIn } from '@/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await signIn(formData)
      if (result && !result.success) {
        setError(result.error ?? 'Error desconocido')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center gap-3 font-black text-xl tracking-tight mb-8">
          <Logo size={72} />
          Cuatro Huellas
        </div>
        <div className="bg-card border border-border rounded-2xl p-7 shadow-sm">
          <h1 className="text-lg font-bold mb-1">Acceso staff</h1>
          <p className="text-sm text-muted-foreground mb-6">Ingresa con tu cuenta para acceder al panel</p>
          <form action={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="tucorreo@ejemplo.cl" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>
            {error && (
              <div className="p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              Ingresar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
