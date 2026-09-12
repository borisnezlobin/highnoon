import { GLASS_TINT_COUNT } from './glassStrand'

export type Rgb = [number, number, number]

export type Palette = {
  ground: Rgb
  ink: Rgb
  signal: Rgb
  glass: Rgb[]
}

function readToken(name: string): Rgb {
  const probe = document.createElement('div')
  probe.style.color = `var(--color-${name})`
  document.body.appendChild(probe)
  const channels = getComputedStyle(probe).color.match(/[\d.]+/g) ?? ['0', '0', '0']
  probe.remove()
  return channels.slice(0, 3).map((channel) => Number(channel) / 255) as Rgb
}

export function readPalette(): Palette {
  return {
    ground: readToken('ground'),
    ink: readToken('ink'),
    signal: readToken('signal'),
    glass: Array.from({ length: GLASS_TINT_COUNT }, (_, index) => readToken(`glass-${index + 1}`)),
  }
}
