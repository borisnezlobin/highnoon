export type TimeLeft = {
  totalMs: number
  hours: number
  minutes: number
  seconds: number
  isFinished: boolean
}

export function getTimeLeft(remainingMs: number): TimeLeft {
  const totalMs = Math.max(0, remainingMs)
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

export function formatClock({ hours, minutes, seconds }: TimeLeft, showHours = true) {
  const minutesAndSeconds = `${pad(minutes)}:${pad(seconds)}`
  return showHours ? `${pad(hours)}:${minutesAndSeconds}` : minutesAndSeconds
}

export function describeTimeLeft(timeLeft: TimeLeft, caption: string, finishedText: string) {
  if (timeLeft.isFinished) return `${finishedText}.`
  return `${timeLeft.hours} hours and ${timeLeft.minutes} minutes left, ${caption}.`
}
