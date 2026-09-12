import type { FontSpec } from '../timer/fonts'

const DIGIT_CHANNEL = '#ff0000'
const ACCENT_CHANNEL = '#00ff00'
const CAPTION_CHANNEL = '#0000ff'

type Glyph = { text: string; weight: number; channel: string; cellWidth: number }

export type TextFrame = { headline: string; isClock: boolean; caption: string; font: FontSpec }

function setFont(context: CanvasRenderingContext2D, font: FontSpec, weight: number, size: number) {
  context.font = `${weight} ${size}px ${font.family}`
  context.fontStretch = font.stretch
}

function widestDigit(context: CanvasRenderingContext2D, font: FontSpec, weight: number, size: number) {
  setFont(context, font, weight, size)
  return Math.max(...'0123456789'.split('').map((digit) => context.measureText(digit).width))
}

function clockGlyphs(context: CanvasRenderingContext2D, clock: string, font: FontSpec, size: number): Glyph[] {
  const boldWidth = widestDigit(context, font, font.clockWeight, size)
  const lightWidth = widestDigit(context, font, font.secondsWeight, size)
  return clock.split('').map((character, index) => {
    if (character === ':') return { text: character, weight: font.clockWeight, channel: ACCENT_CHANNEL, cellWidth: boldWidth * 0.5 }
    const isSeconds = index >= clock.length - 2
    return {
      text: character,
      weight: isSeconds ? font.secondsWeight : font.clockWeight,
      channel: DIGIT_CHANNEL,
      cellWidth: isSeconds ? lightWidth : boldWidth,
    }
  })
}

function measureHeadline(context: CanvasRenderingContext2D, frame: TextFrame, size: number) {
  if (frame.isClock) return clockGlyphs(context, frame.headline, frame.font, size).reduce((sum, glyph) => sum + glyph.cellWidth, 0)
  setFont(context, frame.font, frame.font.clockWeight, size)
  return context.measureText(frame.headline).width
}

function drawClock(context: CanvasRenderingContext2D, frame: TextFrame, centerX: number, baselineY: number, size: number) {
  const glyphs = clockGlyphs(context, frame.headline, frame.font, size)
  let cursorX = centerX - glyphs.reduce((sum, glyph) => sum + glyph.cellWidth, 0) / 2
  for (const glyph of glyphs) {
    setFont(context, frame.font, glyph.weight, size)
    context.fillStyle = glyph.channel
    context.fillText(glyph.text, cursorX + glyph.cellWidth / 2, baselineY)
    cursorX += glyph.cellWidth
  }
}

function drawHeadline(context: CanvasRenderingContext2D, frame: TextFrame, centerX: number, baselineY: number, size: number) {
  setFont(context, frame.font, frame.font.clockWeight, size)
  context.fillStyle = DIGIT_CHANNEL
  context.fillText(frame.headline, centerX, baselineY)
}

function fittedHeadlineSize(context: CanvasRenderingContext2D, frame: TextFrame, width: number, height: number) {
  const preferred = Math.min(width * 0.215, height * 0.36)
  const measured = measureHeadline(context, frame, preferred)
  const available = width * 0.88
  return measured > available ? preferred * (available / measured) : preferred
}

function drawCaption(context: CanvasRenderingContext2D, frame: TextFrame, centerX: number, baselineY: number, width: number, headlineSize: number) {
  const captionSize = Math.max(16, Math.min(28, headlineSize * 0.12))
  context.font = `${frame.font.captionWeight} ${captionSize}px ${frame.font.captionFamily}`
  context.fontStretch = 'normal'
  const fittedSize = Math.min(captionSize, captionSize * ((width * 0.9) / Math.max(1, context.measureText(frame.caption).width)))
  context.font = `${frame.font.captionWeight} ${fittedSize}px ${frame.font.captionFamily}`
  context.fillStyle = CAPTION_CHANNEL
  context.fillText(frame.caption, centerX, baselineY + captionSize * 2.4)
}

export function paintTextLayer(canvas: HTMLCanvasElement, frame: TextFrame, pixelRatio: number) {
  const context = canvas.getContext('2d')
  if (!context) return
  const width = canvas.width / pixelRatio
  const height = canvas.height / pixelRatio
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.fillStyle = '#000000'
  context.fillRect(0, 0, width, height)
  context.textBaseline = 'alphabetic'
  context.textAlign = 'center'

  const size = fittedHeadlineSize(context, frame, width, height)
  const baselineY = height / 2 + size * 0.36
  const draw = frame.isClock ? drawClock : drawHeadline
  draw(context, frame, width / 2, baselineY, size)
  drawCaption(context, frame, width / 2, baselineY, width, size)
}
