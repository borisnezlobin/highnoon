export type Vec2 = { x: number; y: number }

const IDLE_AFTER_MS = 4000

export class PointerTracker {
  position: Vec2 = { x: -9999, y: -9999 }
  velocity: Vec2 = { x: 0, y: 0 }
  lastMovedAt = -Infinity
  private isInside = false

  handleMove(event: PointerEvent, now: number) {
    const elapsed = Math.max(16, now - this.lastMovedAt)
    if (this.isInside) {
      this.velocity = {
        x: ((event.clientX - this.position.x) / elapsed) * 1000,
        y: ((event.clientY - this.position.y) / elapsed) * 1000,
      }
    }
    this.position = { x: event.clientX, y: event.clientY }
    this.lastMovedAt = now
    this.isInside = true
  }

  handleLeave() {
    this.isInside = false
    this.lastMovedAt = -Infinity
  }

  decay(dt: number) {
    const keep = Math.exp(-dt * 8)
    this.velocity = { x: this.velocity.x * keep, y: this.velocity.y * keep }
  }

  isIdle(now: number) {
    return !this.isInside || now - this.lastMovedAt > IDLE_AFTER_MS
  }
}
