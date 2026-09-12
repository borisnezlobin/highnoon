import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string; prefix?: string }

export const INPUT_CLASS =
  'h-11 w-full min-w-0 rounded-xl border border-line bg-ground/50 px-3 text-base text-ink outline-none placeholder:text-muted/70 focus-visible:border-ink aria-invalid:border-signal'

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: ReactNode }) {
  if (!error && !hint) return null
  return <p id={id} className={`text-sm text-pretty ${error ? 'text-signal' : 'text-muted'}`}>{error ?? hint}</p>
}

export function TextField({ label, hint, error, prefix, className = '', ...props }: Props) {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-muted">{prefix}</span>}
        <input id={id} aria-invalid={error ? true : undefined} aria-describedby={hint || error ? hintId : undefined} className={INPUT_CLASS} {...props} />
      </div>
      <FieldMessage id={hintId} error={error} hint={hint} />
    </div>
  )
}
