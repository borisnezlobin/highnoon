type Option<Value extends string> = { value: Value; label: string }

type Props<Value extends string> = {
  label: string
  options: Option<Value>[]
  value: Value
  onChange: (value: Value) => void
  className?: string
}

export function SegmentedControl<Value extends string>({ label, options, value, onChange, className = '' }: Props<Value>) {
  return (
    <div className={`flex shrink-0 rounded-full bg-ink/6 p-1 ${className}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className="h-9 flex-1 rounded-full px-3 text-sm font-medium whitespace-nowrap text-muted outline-none transition-[background-color,color] duration-150 focus-visible:ring-2 focus-visible:ring-signal aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
