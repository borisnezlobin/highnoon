export const COUNTDOWN_TARGET = new Date(2026, 8, 13, 12, 0, 0)

export type TimeLeft = {
  totalMs: number
  hours: number
  minutes: number
  seconds: number
  isFinished: boolean
}

export function getTimeLeft(now: number): TimeLeft {
  const totalMs = Math.max(0, COUNTDOWN_TARGET.getTime() - now)
  const totalSeconds = Math.ceil(totalMs / 1000)
  return {
    totalMs,
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
    isFinished: totalMs === 0,
  }
}

const pad = (value: number) => String(value).padStart(2, '0')

export function formatClock({ hours, minutes, seconds }: TimeLeft) {
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export function describeTarget() {
  const weekday = COUNTDOWN_TARGET.toLocaleDateString('en-US', { weekday: 'long' })
  return `until noon on ${weekday}`
}

export function describeTimeLeftForScreenReaders(timeLeft: TimeLeft) {
  if (timeLeft.isFinished) return 'It’s noon.'
  return `${timeLeft.hours} hours and ${timeLeft.minutes} minutes left until noon.`
}
