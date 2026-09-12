import { FONTS, type FontId } from './fonts'

export const SITE_HOST = 'presenttimer.surge.sh'

export type TimerConfig = {
  target: string
  caption: string
  finishedText: string
  font: FontId
}

const STORAGE_KEY = 'highnoon.timer'
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/

export function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug)
}

export function nextNoon(now = new Date()) {
  const noon = new Date(now)
  noon.setHours(12, 0, 0, 0)
  if (noon.getTime() <= now.getTime()) noon.setDate(noon.getDate() + 1)
  return noon
}

export function defaultTimer(): TimerConfig {
  return { target: nextNoon().toISOString(), caption: '', finishedText: '', font: 'bricolage' }
}

export function normalizeTimer(value: Partial<TimerConfig>): TimerConfig {
  const fallback = defaultTimer()
  const target = Number.isNaN(Date.parse(value.target ?? '')) ? fallback.target : value.target!
  const font = FONTS.some((option) => option.id === value.font) ? value.font! : fallback.font
  return { target, font, caption: value.caption ?? '', finishedText: value.finishedText ?? '' }
}

export function loadRootTimer(): TimerConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? normalizeTimer(JSON.parse(saved)) : defaultTimer()
  } catch {
    return defaultTimer()
  }
}

export function saveRootTimer(timer: TimerConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timer))
  } catch {
    // Private windows can refuse storage; the timer still works for this visit.
  }
}

function isAtMinute(date: Date, hours: number) {
  return date.getHours() === hours && date.getMinutes() === 0
}

export function describeClockTime(date: Date) {
  if (isAtMinute(date, 12)) return 'noon'
  if (isAtMinute(date, 0)) return 'midnight'
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function startOfDay(date: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

function describeDay(target: Date, now: Date) {
  const daysAway = Math.round((startOfDay(target) - startOfDay(now)) / 86_400_000)
  if (daysAway === 0) return 'today'
  if (daysAway === 1) return 'tomorrow'
  if (daysAway > 1 && daysAway < 7) return `on ${target.toLocaleDateString('en-US', { weekday: 'long' })}`
  return `on ${target.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
}

export function autoCaption(target: Date, now = new Date()) {
  return `until ${describeClockTime(target)} ${describeDay(target, now)}`
}

export function autoFinishedText(target: Date) {
  if (isAtMinute(target, 12)) return 'It’s noon'
  if (isAtMinute(target, 0)) return 'It’s midnight'
  return 'Time’s up'
}

export function resolveCaption(timer: TimerConfig) {
  return timer.caption.trim() || autoCaption(new Date(timer.target))
}

export function resolveFinishedText(timer: TimerConfig) {
  return timer.finishedText.trim() || autoFinishedText(new Date(timer.target))
}
