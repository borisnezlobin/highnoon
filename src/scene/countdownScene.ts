import { Blob, type Repeller } from './blob'
import { readPalette } from './palette'
import { PointerTracker } from './pointer'
import { Renderer } from './renderer'
import { paintTextLayer, type TextFrame } from './textLayer'
import type { FontSpec } from '../timer/fonts'
import { GlassStrands } from './glassStrand'
import { formatClock, getTimeLeft, type TimeLeft } from '../timer/timeLeft'

const REDUCED_MOTION_SPEED = 0.15

export type SceneTimer = {
  remainingMs: (now: number) => number
  isPaused: boolean
  showHours: boolean
  caption: string
  finishedText: string
  font: FontSpec
}

function textFrameFor(now: number, timer: SceneTimer): TextFrame {
  const timeLeft = getTimeLeft(timer.remainingMs(now))
  const shared = { caption: timer.caption, font: timer.font }
  if (timeLeft.isFinished) return { ...shared, headline: timer.finishedText, isClock: false }
  return { ...shared, headline: formatClock(timeLeft, timer.showHours), isClock: true }
}

function pulseFor(timeLeft: TimeLeft, timer: SceneTimer, reducedMotion: boolean) {
  if (timeLeft.isFinished || timer.isPaused || reducedMotion) return 0
  const millisIntoSecond = (1000 - (timeLeft.totalMs % 1000)) % 1000
  return Math.exp(-(millisIntoSecond / 1000) * 5)
}

function ghostPath(time: number, width: number, height: number) {
  return {
    x: width * (0.5 + 0.42 * Math.sin(time * 0.23)),
    y: height * (0.5 + 0.3 * Math.sin(time * 0.37 + 1.2)),
  }
}

function approach(current: number, target: number, dt: number, rate: number) {
  return current + (target - current) * (1 - Math.exp(-dt * rate))
}

export class CountdownScene {
  private renderer: Renderer
  private blob = new Blob()
  private strand = new GlassStrands()
  private pointer = new PointerTracker()
  private textCanvas = document.createElement('canvas')
  private paintedText = ''
  private width = 0
  private height = 0
  private pixelRatio = 1
  private sceneTime = 0
  private lastFrameAt = performance.now()
  private ghostWeight = 0
  private scatter = 0
  private frameRequest = 0
  reducedMotion = false

  private canvas: HTMLCanvasElement
  private timer: SceneTimer

  constructor(canvas: HTMLCanvasElement, timer: SceneTimer) {
    this.canvas = canvas
    this.timer = timer
    this.renderer = new Renderer(canvas, readPalette())
    this.sceneTime = (Date.now() / 1000) % 10_000
  }

  start() {
    this.resize()
    window.addEventListener('resize', this.resize)
    window.addEventListener('pointermove', this.handlePointerMove)
    document.documentElement.addEventListener('pointerleave', this.handlePointerLeave)
    this.frameRequest = requestAnimationFrame(this.tick)
  }

  stop() {
    cancelAnimationFrame(this.frameRequest)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('pointermove', this.handlePointerMove)
    document.documentElement.removeEventListener('pointerleave', this.handlePointerLeave)
  }

  setTimer(timer: SceneTimer) {
    this.timer = timer
  }

  private handlePointerMove = (event: PointerEvent) => this.pointer.handleMove(event, performance.now())

  private handlePointerLeave = () => this.pointer.handleLeave()

  private resize = () => {
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    this.width = window.innerWidth
    this.height = window.innerHeight
    const pixelWidth = Math.round(this.width * this.pixelRatio)
    const pixelHeight = Math.round(this.height * this.pixelRatio)
    this.canvas.width = this.textCanvas.width = pixelWidth
    this.canvas.height = this.textCanvas.height = pixelHeight
    this.renderer.resize(pixelWidth, pixelHeight, this.pixelRatio)
    this.blob.resize(this.width, this.height)
    this.strand.resize(this.width, this.height)
    this.paintedText = ''
  }

  private refreshText(now: number) {
    const frame = textFrameFor(now, this.timer)
    const signature = `${frame.headline}|${frame.caption}|${frame.font.id}|${this.width}x${this.height}`
    if (signature === this.paintedText) return
    paintTextLayer(this.textCanvas, frame, this.pixelRatio)
    this.renderer.uploadText(this.textCanvas)
    this.paintedText = signature
  }

  private collectRepellers(frameTime: number, dt: number): Repeller[] {
    const repellers: Repeller[] = []
    const pointerIdle = this.pointer.isIdle(frameTime)
    if (!pointerIdle) repellers.push({ position: this.pointer.position, velocity: this.pointer.velocity, strength: 1 })

    const wantsGhost = pointerIdle && !this.reducedMotion
    this.ghostWeight = approach(this.ghostWeight, wantsGhost ? 0.75 : 0, dt, 0.6)
    if (this.ghostWeight < 0.01) return repellers

    const here = ghostPath(this.sceneTime, this.width, this.height)
    const ahead = ghostPath(this.sceneTime + 0.1, this.width, this.height)
    const velocity = { x: (ahead.x - here.x) * 10, y: (ahead.y - here.y) * 10 }
    repellers.push({ position: here, velocity, strength: this.ghostWeight })
    return repellers
  }

  private tick = (frameTime: number) => {
    const dt = Math.min((frameTime - this.lastFrameAt) / 1000, 1 / 30)
    this.lastFrameAt = frameTime
    this.sceneTime += dt * (this.reducedMotion ? REDUCED_MOTION_SPEED : 1)

    const now = Date.now()
    const timeLeft = getTimeLeft(this.timer.remainingMs(now))
    this.refreshText(now)

    this.scatter = approach(this.scatter, timeLeft.isFinished ? 1 : 0, dt, 1.5)
    this.blob.setScatter(this.scatter)
    this.pointer.decay(dt)
    this.blob.step(dt, this.sceneTime, this.collectRepellers(frameTime, dt))

    const pieces = this.strand.build(this.sceneTime)
    const pulse = pulseFor(timeLeft, this.timer, this.reducedMotion)

    this.renderer.draw({ time: this.sceneTime, pulse, blob: this.blob, pieces, cssHeight: this.height, pixelRatio: this.pixelRatio })
    this.frameRequest = requestAnimationFrame(this.tick)
  }
}
