import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '../ui/Button'

type Props = { value: Date; onChange: (date: Date) => void }

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const KEY_STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

function today() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function monthCells(month: Date) {
  const leading = Array.from({ length: month.getDay() }, () => null)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))
  return [...leading, ...days]
}

function dayClass(isSelected: boolean, isToday: boolean) {
  if (isSelected) return 'bg-ink text-ground font-semibold'
  if (isToday) return 'ring-1 ring-ink/40 ring-inset hover:bg-ink/6'
  return 'hover:bg-ink/6'
}

export function CalendarPicker({ value, onChange }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(value))
  const [focusedDay, setFocusedDay] = useState(() => new Date(value.getFullYear(), value.getMonth(), value.getDate()))
  const shouldMoveFocus = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const firstAllowedDay = today()

  useEffect(() => {
    if (!shouldMoveFocus.current) return
    shouldMoveFocus.current = false
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${dayKey(focusedDay)}"]`)?.focus()
  }, [focusedDay, visibleMonth])

  const moveFocus = (day: Date) => {
    const target = day < firstAllowedDay ? firstAllowedDay : day
    shouldMoveFocus.current = true
    setFocusedDay(target)
    setVisibleMonth(monthStart(target))
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const step = KEY_STEPS[event.key]
    if (step === undefined) return
    event.preventDefault()
    moveFocus(addDays(focusedDay, step))
  }

  const chooseDay = (day: Date) => {
    const next = new Date(day)
    next.setHours(value.getHours(), value.getMinutes(), 0, 0)
    setFocusedDay(day)
    onChange(next)
  }

  const shiftMonth = (delta: number) => {
    const month = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1)
    setVisibleMonth(month)
    setFocusedDay(month < firstAllowedDay ? firstAllowedDay : month)
  }

  const canGoBack = visibleMonth > monthStart(firstAllowedDay)
  const focusedInMonth = focusedDay.getMonth() === visibleMonth.getMonth() ? dayKey(focusedDay) : ''

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="pl-1 font-semibold" aria-live="polite">
          {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex">
          <Button variant="quiet" shape="circle" onClick={() => shiftMonth(-1)} disabled={!canGoBack} aria-label="Previous month">
            <CaretLeftIcon size={18} weight="bold" aria-hidden="true" />
          </Button>
          <Button variant="quiet" shape="circle" onClick={() => shiftMonth(1)} aria-label="Next month">
            <CaretRightIcon size={18} weight="bold" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-sm text-muted" aria-hidden="true">
        {WEEKDAYS.map((weekday) => <span key={weekday} className="py-1">{weekday}</span>)}
      </div>
      <div ref={gridRef} className="grid grid-cols-7 gap-y-1" onKeyDown={handleKeyDown} role="group" aria-label="Choose a day">
        {monthCells(visibleMonth).map((day, index) => {
          if (!day) return <span key={`blank-${index}`} />
          const key = dayKey(day)
          const isSelected = key === dayKey(value)
          return (
            <button
              key={key}
              type="button"
              data-day={key}
              tabIndex={key === focusedInMonth || (!focusedInMonth && day.getDate() === 1) ? 0 : -1}
              disabled={day < firstAllowedDay}
              aria-pressed={isSelected}
              aria-label={day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              onClick={() => chooseDay(day)}
              className={`mx-auto flex size-10 items-center justify-center rounded-full text-sm tabular-nums outline-none transition-[background-color] duration-150 focus-visible:ring-2 focus-visible:ring-signal disabled:text-muted/40 disabled:hover:bg-transparent ${dayClass(isSelected, key === dayKey(firstAllowedDay))}`}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
