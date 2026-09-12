import type { Vec2 } from './pointer'

type BallLayout = { dx: number; dy: number; radius: number }

const BODY: BallLayout[] = [
  { dx: 0, dy: 0.01, radius: 0.15 },
  { dx: -0.15, dy: 0.06, radius: 0.12 },
  { dx: 0.14, dy: -0.05, radius: 0.12 },
  { dx: 0.04, dy: 0.15, radius: 0.1 },
  { dx: -0.07, dy: -0.14, radius: 0.09 },
  { dx: 0.27, dy: 0.08, radius: 0.08 },
  { dx: -0.28, dy: -0.04, radius: 0.075 },
  { dx: 0.18, dy: 0.2, radius: 0.06 },
]

const SATELLITES: BallLayout[] = [
  { dx: -0.4, dy: -0.25, radius: 0.05 },
  { dx: 0.36, dy: -0.28, radius: 0.055 },
  { dx: 0.46, dy: 0.22, radius: 0.04 },
  { dx: -0.44, dy: 0.26, radius: 0.045 },
  { dx: 0.02, dy: -0.34, radius: 0.035 },
  { dx: -0.2, dy: 0.34, radius: 0.03 },
]

export const BALL_LAYOUT = [...BODY, ...SATELLITES]

type Ball = { position: Vec2; velocity: Vec2; radius: number; layout: BallLayout; phase: number }

export type Repeller = { position: Vec2; velocity: Vec2; strength: number }

const SPRING = 14
const DAMPING = 4.2

export class Blob {
  balls: Ball[]
  private center: Vec2 = { x: 0, y: 0 }
  private unit = 1
  private scatter = 0

  constructor() {
    this.balls = BALL_LAYOUT.map((layout, index) => ({
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 0,
      layout,
      phase: index * 1.618,
    }))
  }

  resize(width: number, height: number) {
    const isFirstLayout = this.unit === 1
    this.center = { x: width / 2, y: height / 2 }
    this.unit = Math.min(width * (width < height ? 0.9 : 0.5), height * 0.82)
    for (const ball of this.balls) {
      ball.radius = ball.layout.radius * this.unit
      if (isFirstLayout) ball.position = this.homeOf(ball, 0)
    }
  }

  setScatter(amount: number) {
    this.scatter = amount
  }

  step(dt: number, time: number, repellers: Repeller[]) {
    for (const ball of this.balls) {
      ball.radius = ball.layout.radius * this.unit * (1 + 0.08 * Math.sin(time * 0.9 + ball.phase))
      const home = this.homeOf(ball, time)
      const push = repellers.reduce((sum, repeller) => addVec(sum, this.repelForce(ball, repeller)), { x: 0, y: 0 })
      const mass = ball.radius / (0.1 * this.unit)
      ball.velocity.x += ((home.x - ball.position.x) * SPRING - ball.velocity.x * DAMPING + push.x / mass) * dt
      ball.velocity.y += ((home.y - ball.position.y) * SPRING - ball.velocity.y * DAMPING + push.y / mass) * dt
      ball.position.x += ball.velocity.x * dt
      ball.position.y += ball.velocity.y * dt
    }
  }

  private homeOf(ball: Ball, time: number): Vec2 {
    const spread = 1 + this.scatter * 1.4
    const drift = this.unit * 0.03
    const isSatellite = ball.layout.radius < 0.06
    const sway = Math.sin(time * 0.07 + ball.phase) * (isSatellite ? 0.4 : 0.14)
    const dx = ball.layout.dx * Math.cos(sway) - ball.layout.dy * Math.sin(sway)
    const dy = ball.layout.dx * Math.sin(sway) + ball.layout.dy * Math.cos(sway)
    return {
      x: this.center.x + dx * this.unit * spread + (Math.sin(time * 0.5 + ball.phase) + 0.8 * Math.sin(time * 0.23 + ball.phase * 2.3)) * drift,
      y: this.center.y + dy * this.unit * spread + (Math.cos(time * 0.41 + ball.phase * 1.7) + 0.8 * Math.cos(time * 0.19 + ball.phase * 0.7)) * drift,
    }
  }

  private repelForce(ball: Ball, repeller: Repeller): Vec2 {
    const offset = { x: ball.position.x - repeller.position.x, y: ball.position.y - repeller.position.y }
    const distance = Math.hypot(offset.x, offset.y) || 1
    const reach = this.unit * 0.22 + ball.radius
    if (distance >= reach) return { x: 0, y: 0 }
    const falloff = (1 - distance / reach) ** 2
    const shove = falloff * this.unit * 90 * repeller.strength
    return {
      x: (offset.x / distance) * shove + repeller.velocity.x * falloff * 2.5 * repeller.strength,
      y: (offset.y / distance) * shove + repeller.velocity.y * falloff * 2.5 * repeller.strength,
    }
  }
}

function addVec(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}
