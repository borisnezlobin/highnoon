const FAMILY = '"Bricolage Grotesque Variable"'
const DIGIT_CHANNEL = '#ff0000'
const ACCENT_CHANNEL = '#00ff00'
const CAPTION_CHANNEL = '#0000ff'

type Glyph = { text: string; weight: number; channel: string; cellWidth: number }

export async function loadTextFonts() {
  await Promise.all([
    document.fonts.load(`700 100px ${FAMILY}`),
    document.fonts.load(`300 100px ${FAMILY}`),
    document.fonts.load(`500 20px ${FAMILY}`),
  ])
}

function setFont(context: CanvasRenderingContext2D, weight: number, size: number) {
  context.font = `${weight} ${size}px ${FAMILY}`
  context.fontStretch = 'condensed'
}

function widestDigit(context: CanvasRenderingContext2D, weight: number, size: number) {
  setFont(context, weight, size)
  return Math.max(...'0123456789'.split('').map((digit) => context.measureText(digit).width))
}

function clockGlyphs(context: CanvasRenderingContext2D, clock: string, size: number): Glyph[] {
  const boldWidth = widestDigit(context, 700, size)
  const lightWidth = widestDigit(context, 300, size)
  return clock.split('').map((character, index) => {
    const weight = index >= 6 ? 300 : 700
    if (character === ':') return { text: character, weight: 700, channel: ACCENT_CHANNEL, cellWidth: boldWidth * 0.5 }
    return { text: character, weight, channel: DIGIT_CHANNEL, cellWidth: weight === 700 ? boldWidth : lightWidth }
  })
}

function drawClock(context: CanvasRenderingContext2D, clock: string, centerX: number, baselineY: number, size: number) {
  const glyphs = clockGlyphs(context, clock, size)
  const totalWidth = glyphs.reduce((sum, glyph) => sum + glyph.cellWidth, 0)
  let cursorX = centerX - totalWidth / 2
  context.textAlign = 'center'
  for (const glyph of glyphs) {
    setFont(context, glyph.weight, size)
    context.fillStyle = glyph.channel
    context.fillText(glyph.text, cursorX + glyph.cellWidth / 2, baselineY)
    cursorX += glyph.cellWidth
  }
}

function drawHeadline(context: CanvasRenderingContext2D, headline: string, centerX: number, baselineY: number, size: number) {
  setFont(context, 700, size)
  context.textAlign = 'center'
  context.fillStyle = DIGIT_CHANNEL
  context.fillText(headline, centerX, baselineY)
}

export type TextFrame = { headline: string; isClock: boolean; caption: string }

export function paintTextLayer(canvas: HTMLCanvasElement, frame: TextFrame, pixelRatio: number) {
  const context = canvas.getContext('2d')
  if (!context) return
  const width = canvas.width / pixelRatio
  const height = canvas.height / pixelRatio
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.fillStyle = '#000000'
  context.fillRect(0, 0, width, height)
  context.textBaseline = 'alphabetic'

  const size = Math.min(width * 0.215, height * 0.36)
  const baselineY = height / 2 + size * 0.36
  const draw = frame.isClock ? drawClock : drawHeadline
  draw(context, frame.headline, width / 2, baselineY, size)

  const captionSize = Math.max(16, Math.min(28, size * 0.12))
  setFont(context, 500, captionSize)
  context.fontStretch = 'normal'
  context.textAlign = 'center'
  context.fillStyle = CAPTION_CHANNEL
  context.fillText(frame.caption, width / 2, baselineY + captionSize * 2.4)
}
