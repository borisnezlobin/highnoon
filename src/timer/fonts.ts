export type FontId = 'bricolage' | 'bigShoulders' | 'unbounded' | 'jetbrains'

export type FontSpec = {
  id: FontId
  label: string
  family: string
  captionFamily: string
  stretch: 'condensed' | 'normal'
  clockWeight: number
  secondsWeight: number
  captionWeight: number
}

const BRICOLAGE = '"Bricolage Grotesque Variable"'

export const FONTS: FontSpec[] = [
  { id: 'bricolage', label: 'Bricolage', family: BRICOLAGE, captionFamily: BRICOLAGE, stretch: 'condensed', clockWeight: 700, secondsWeight: 300, captionWeight: 500 },
  { id: 'bigShoulders', label: 'Big Shoulders', family: '"Big Shoulders Display Variable"', captionFamily: BRICOLAGE, stretch: 'normal', clockWeight: 800, secondsWeight: 400, captionWeight: 500 },
  { id: 'unbounded', label: 'Unbounded', family: '"Unbounded Variable"', captionFamily: '"Unbounded Variable"', stretch: 'normal', clockWeight: 700, secondsWeight: 300, captionWeight: 400 },
  { id: 'jetbrains', label: 'JetBrains Mono', family: '"JetBrains Mono Variable"', captionFamily: BRICOLAGE, stretch: 'normal', clockWeight: 700, secondsWeight: 300, captionWeight: 500 },
]

export function fontById(id: FontId): FontSpec {
  return FONTS.find((font) => font.id === id) ?? FONTS[0]
}

export async function loadFont(font: FontSpec) {
  await Promise.all([
    document.fonts.load(`${font.clockWeight} 100px ${font.family}`),
    document.fonts.load(`${font.secondsWeight} 100px ${font.family}`),
    document.fonts.load(`${font.captionWeight} 20px ${font.captionFamily}`),
  ])
}
