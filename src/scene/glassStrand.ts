import type { Vec2 } from './pointer'

export type GlassPiece = { x: number; y: number; size: number; angle: number; tint: number }

export const MAX_PIECES = 96
export const GLASS_TINT_COUNT = 5

type StrandShape = {
  start: Vec2
  end: Vec2
  bend: Vec2
  bendWaves: number
  bendPhase: number
  sizeScale: number
  waveSpeed: number
  flowSpeed: number
  tintOffset: number
  landscapeOnly?: boolean
}

const STRAND_SHAPES: StrandShape[] = [
  { start: { x: -0.16, y: 0.8 }, end: { x: 1.16, y: 0.22 }, bend: { x: 0, y: 0.14 }, bendWaves: 1.1, bendPhase: 0.5, sizeScale: 1, waveSpeed: 0.32, flowSpeed: 0.005, tintOffset: 0 },
  { start: { x: -0.18, y: 0.24 }, end: { x: 0.58, y: -0.2 }, bend: { x: 0.03, y: 0.05 }, bendWaves: 1.2, bendPhase: 2.1, sizeScale: 0.62, waveSpeed: 0.24, flowSpeed: -0.004, tintOffset: 3 },
  { start: { x: 0.46, y: 1.18 }, end: { x: 1.18, y: 0.66 }, bend: { x: 0.05, y: 0.07 }, bendWaves: 0.9, bendPhase: 1.0, sizeScale: 0.8, waveSpeed: 0.4, flowSpeed: 0.006, tintOffset: 6 },
  { start: { x: -0.1, y: 0.28 }, end: { x: 0.3, y: 1.2 }, bend: { x: 0.04, y: 0.02 }, bendWaves: 0.8, bendPhase: 1.2, sizeScale: 0.5, waveSpeed: 0.28, flowSpeed: -0.005, tintOffset: 8, landscapeOnly: true },
]

const TAU = Math.PI * 2
const ARC_SAMPLES = 480
const WAVES = 3
const SQUEEZE = 0.6
const TINT_PATTERN = [0, 2, 4, 1, 3, 2, 0, 4, 3, 1]

class GlassStrand {
  private arcU: number[] = []
  private arcLength: number[] = []
  private totalLength = 1
  private width = 1
  private height = 1
  private shape: StrandShape

  constructor(shape: StrandShape) {
    this.shape = shape
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.arcU = [0]
    this.arcLength = [0]
    let previous = this.pointAt(0)
    for (let sample = 1; sample <= ARC_SAMPLES; sample++) {
      const u = sample / ARC_SAMPLES
      const point = this.pointAt(u)
      this.arcU.push(u)
      this.arcLength.push(this.arcLength[sample - 1] + Math.hypot(point.x - previous.x, point.y - previous.y))
      previous = point
    }
    this.totalLength = this.arcLength[ARC_SAMPLES]
  }

  pieceCount() {
    if (this.shape.landscapeOnly && this.width < this.height) return 0
    return Math.round(this.totalLength / (this.baseSize() * 0.95))
  }

  build(time: number, count: number): GlassPiece[] {
    const { waveSpeed, flowSpeed, tintOffset } = this.shape
    const baseSize = this.baseSize()
    const pieces: GlassPiece[] = []
    for (let index = 0; index < count; index++) {
      const base = (((index + 0.5) / count + time * flowSpeed) % 1 + 1) % 1
      const phase = TAU * WAVES * base - time * waveSpeed
      const along = base + (SQUEEZE / (TAU * WAVES)) * Math.sin(phase)
      const u = this.uAtDistance(along * this.totalLength)
      const here = this.pointAt(u)
      const ahead = this.pointAt(u + 0.001)
      const tangent = Math.atan2(ahead.y - here.y, ahead.x - here.x)
      pieces.push({
        ...here,
        size: baseSize * (1 + 0.2 * Math.cos(phase)),
        angle: tangent + 0.6 * Math.cos(phase) + 0.4 * Math.sin(TAU * 0.7 * base + time * 0.21 + tintOffset),
        tint: TINT_PATTERN[(index + tintOffset) % TINT_PATTERN.length],
      })
    }
    return pieces
  }

  private baseSize() {
    return Math.min(this.width, this.height) * 0.07 * this.shape.sizeScale
  }

  private pointAt(u: number): Vec2 {
    const { start, end, bend, bendWaves, bendPhase } = this.shape
    const wave = Math.sin(u * TAU * bendWaves + bendPhase)
    return {
      x: (start.x + (end.x - start.x) * u + bend.x * wave) * this.width,
      y: (start.y + (end.y - start.y) * u + bend.y * wave) * this.height,
    }
  }

  private uAtDistance(distance: number) {
    const clamped = Math.min(Math.max(distance, 0), this.totalLength)
    let low = 0
    let high = ARC_SAMPLES
    while (high - low > 1) {
      const middle = (low + high) >> 1
      if (this.arcLength[middle] < clamped) low = middle
      else high = middle
    }
    const span = this.arcLength[high] - this.arcLength[low] || 1
    const blend = (clamped - this.arcLength[low]) / span
    return this.arcU[low] + (this.arcU[high] - this.arcU[low]) * blend
  }
}

export class GlassStrands {
  private strands = STRAND_SHAPES.map((shape) => new GlassStrand(shape))
  private counts: number[] = []

  resize(width: number, height: number) {
    this.strands.forEach((strand) => strand.resize(width, height))
    const wanted = this.strands.map((strand) => strand.pieceCount())
    const fit = Math.min(1, MAX_PIECES / wanted.reduce((sum, count) => sum + count, 0))
    this.counts = wanted.map((count) => Math.floor(count * fit))
  }

  build(time: number): GlassPiece[] {
    return this.strands.flatMap((strand, index) => strand.build(time, this.counts[index]))
  }
}
