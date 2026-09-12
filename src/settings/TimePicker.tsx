import { useId } from 'react'
import { INPUT_CLASS } from '../ui/TextField'

type Props = { value: Date; onChange: (date: Date) => void }

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5)

function withTime(date: Date, hours12: number, minutes: number, isPm: boolean) {
  const next = new Date(date)
  next.setHours((hours12 % 12) + (isPm ? 12 : 0), minutes, 0, 0)
  return next
}

export function TimePicker({ value, onChange }: Props) {
  const id = useId()
  const isPm = value.getHours() >= 12
  const hours12 = value.getHours() % 12 || 12
  const minutes = value.getMinutes()
  const minuteOptions = MINUTES.includes(minutes) ? MINUTES : [...MINUTES, minutes].sort((a, b) => a - b)

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Time</legend>
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-hour`} className="sr-only">Hour</label>
        <select id={`${id}-hour`} className={`${INPUT_CLASS} tabular-nums`} value={hours12} onChange={(event) => onChange(withTime(value, Number(event.target.value), minutes, isPm))}>
          {HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
        </select>
        <span aria-hidden="true" className="font-semibold">:</span>
        <label htmlFor={`${id}-minute`} className="sr-only">Minute</label>
        <select id={`${id}-minute`} className={`${INPUT_CLASS} tabular-nums`} value={minutes} onChange={(event) => onChange(withTime(value, hours12, Number(event.target.value), isPm))}>
          {minuteOptions.map((minute) => <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>)}
        </select>
        <div className="flex shrink-0 rounded-full bg-ink/6 p-1" role="group" aria-label="Morning or afternoon">
          {(['AM', 'PM'] as const).map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={(period === 'PM') === isPm}
              onClick={() => onChange(withTime(value, hours12, minutes, period === 'PM'))}
              className="h-9 rounded-full px-3 text-sm font-medium text-muted outline-none transition-[background-color,color] duration-150 focus-visible:ring-2 focus-visible:ring-signal aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm"
            >
              {period}
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  )
}
