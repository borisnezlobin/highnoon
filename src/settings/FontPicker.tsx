import { CheckCircleIcon } from '@phosphor-icons/react'
import { FONTS, type FontId } from '../timer/fonts'

type Props = { value: FontId; onChange: (font: FontId) => void }

export function FontPicker({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">Font</legend>
      <div className="grid grid-cols-2 gap-2">
        {FONTS.map((font) => (
          <label
            key={font.id}
            className="relative flex cursor-pointer flex-col gap-1 rounded-2xl bg-ground/60 p-3 transition-[background-color,box-shadow] duration-150 hover:bg-ground has-checked:bg-surface has-checked:shadow-[0_0_0_2px_var(--color-ink)] has-focus-visible:shadow-[0_0_0_2px_var(--color-signal)]"
          >
            <input type="radio" name="font" value={font.id} checked={value === font.id} onChange={() => onChange(font.id)} className="sr-only" />
            <span className="text-2xl leading-tight tabular-nums" style={{ fontFamily: font.family, fontWeight: font.clockWeight, fontStretch: font.stretch }} aria-hidden="true">
              12:34
            </span>
            <span className="text-sm text-muted">{font.label}</span>
            {value === font.id && <CheckCircleIcon size={20} weight="fill" className="absolute top-2.5 right-2.5" aria-hidden="true" />}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
