import { useId } from 'react'
import { INPUT_CLASS } from '../ui/TextField'
import { MAX_DURATION_SECONDS } from '../timer/timerConfig'

type Props = { value: number; onChange: (seconds: number) => void }

const PRESET_MINUTES = [5, 10, 15, 20, 30, 45, 60]
const HOURS = Array.from({ length: MAX_DURATION_SECONDS / 3600 }, (_, index) => index)
const SIXTY = Array.from({ length: 60 }, (_, index) => index)

type Unit = { key: 'hours' | 'minutes' | 'seconds'; label: string; options: number[] }

const UNITS: Unit[] = [
  { key: 'hours', label: 'Hours', options: HOURS },
  { key: 'minutes', label: 'Minutes', options: SIXTY },
  { key: 'seconds', label: 'Seconds', options: SIXTY },
]

function splitDuration(totalSeconds: number) {
  return { hours: Math.floor(totalSeconds / 3600), minutes: Math.floor(totalSeconds / 60) % 60, seconds: totalSeconds % 60 }
}

function formatPreset(minutes: number) {
  return minutes === 60 ? '1 hour' : `${minutes} min`
}

export function DurationPicker({ value, onChange }: Props) {
  const id = useId()
  const parts = splitDuration(value)

  const changeUnit = (key: Unit['key'], amount: number) => {
    const next = { ...parts, [key]: amount }
    const total = next.hours * 3600 + next.minutes * 60 + next.seconds
    onChange(Math.min(MAX_DURATION_SECONDS, Math.max(1, total)))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Common lengths">
        {PRESET_MINUTES.map((minutes) => (
          <button
            key={minutes}
            type="button"
            aria-pressed={value === minutes * 60}
            onClick={() => onChange(minutes * 60)}
            className="h-9 rounded-full bg-ink/6 px-3.5 text-sm font-medium tabular-nums outline-none transition-[background-color,color] duration-150 hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-signal aria-pressed:bg-ink aria-pressed:text-ground"
          >
            {formatPreset(minutes)}
          </button>
        ))}
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Length</legend>
        <div className="grid grid-cols-3 gap-2">
          {UNITS.map((unit) => (
            <div key={unit.key} className="flex flex-col gap-1">
              <select
                id={`${id}-${unit.key}`}
                className={`${INPUT_CLASS} tabular-nums`}
                value={parts[unit.key]}
                onChange={(event) => changeUnit(unit.key, Number(event.target.value))}
              >
                {unit.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <label htmlFor={`${id}-${unit.key}`} className="text-sm text-muted">{unit.label}</label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
