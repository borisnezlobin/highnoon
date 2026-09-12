import type { ButtonHTMLAttributes } from 'react'

type Variant = 'floating' | 'primary' | 'quiet'
type Shape = 'pill' | 'circle'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; shape?: Shape }

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap select-none outline-none transition-[opacity,scale,background-color] duration-150 ease-standard active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ground disabled:opacity-40 disabled:active:scale-100'

const VARIANTS: Record<Variant, string> = {
  floating: 'bg-control/90 text-control-text shadow-lg hover:bg-control',
  primary: 'bg-control text-control-text hover:bg-control/85',
  quiet: 'text-ink hover:bg-ink/6',
}

const SHAPES: Record<Shape, string> = {
  pill: 'h-10 rounded-full px-4 text-sm',
  circle: 'size-10 rounded-full',
}

export function Button({ variant = 'primary', shape = 'pill', className = '', type = 'button', ...props }: Props) {
  return <button type={type} className={`${BASE} ${VARIANTS[variant]} ${SHAPES[shape]} ${className}`} {...props} />
}
