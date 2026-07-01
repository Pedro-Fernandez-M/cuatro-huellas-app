'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface Props {
  blockedDates: string[]
  selected: string | null
  onSelect: (date: string) => void
  maxDaysAhead?: number
}

export default function MiniCalendar({ blockedDates, selected, onSelect, maxDaysAhead = 60 }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + maxDaysAhead)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  function toDateStr(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function isDisabled(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    const isPast = d < today
    const isFuture = d > maxDate
    const isSunday = d.getDay() === 0
    const isBlocked = blockedDates.includes(toDateStr(day))
    return isPast || isFuture || isSunday || isBlocked
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-semibold text-sm">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = toDateStr(day)
          const disabled = isDisabled(day)
          const isSelected = selected === dateStr
          const isToday = new Date(viewYear, viewMonth, day).toDateString() === today.toDateString()
          return (
            <button
              key={i}
              type="button"
              onClick={() => !disabled && onSelect(dateStr)}
              disabled={disabled}
              className={`
                aspect-square rounded-lg text-sm font-medium transition-all
                ${disabled ? 'opacity-25 cursor-not-allowed' : 'hover:bg-primary/20 cursor-pointer'}
                ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}
                ${isToday && !isSelected ? 'border border-primary/50 text-primary' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
