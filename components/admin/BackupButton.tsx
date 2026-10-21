'use client'

import { useState, useTransition } from 'react'
import { Download, Loader2, Check } from 'lucide-react'
import { downloadBackup } from '@/actions/backup'
import { Button } from '@/components/ui/button'

export default function BackupButton() {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function run() {
    setError(null)
    setDone(false)
    startTransition(async () => {
      const r = await downloadBackup()
      if (r.error) { setError(r.error); return }
      // Dispara la descarga del archivo en el navegador.
      const blob = new Blob([r.json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = r.filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setDone(true)
    })
  }

  return (
    <div>
      <Button onClick={run} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : done ? <Check className="size-4" /> : <Download className="size-4" />}
        {isPending ? 'Generando…' : done ? 'Descargado ✓' : 'Descargar respaldo ahora'}
      </Button>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
