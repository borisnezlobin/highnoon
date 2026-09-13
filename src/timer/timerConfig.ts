import { FONTS, type FontId } from './fonts'

export const SITE_HOST = 'bntimer.surge.sh'

export type TimerMode = 'until' | 'duration'

export type TimerConfig = {
  mode: TimerMode
  target: string
  durationSeconds: number
  caption: string
  finishedText: string
  font: FontId
}

const STORAGE_KEY = 'highnoon.timer'
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/

const RESERVED_SLUGS = ['assets']

export const MAX_CAPTION_LENGTH = 120
export const MAX_FINISHED_TEXT_LENGTH = 60
export const MAX_DURATION_SECONDS = 24 * 3600
const DEFAULT_DURATION_SECONDS = 15 * 60

export function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.includes(slug)
}

export function nextNoon(now = new Date()) {
  const noon = new Date(now)
  noon.setHours(12, 0, 0, 0)
  if (noon.getTime() <= now.getTime()) noon.setDate(noon.getDate() + 1)
  return noon
}

export function defaultTimer(): TimerConfig {
  return { mode: 'until', target: nextNoon().toISOString(), durationSeconds: DEFAULT_DURATION_SECONDS, caption: '', finishedText: '', font: 'bricolage' }
}

export function normalizeTimer(value: Partial<TimerConfig>): TimerConfig {
  const fallback = defaultTimer()
  const target = Number.isNaN(Date.parse(value.target ?? '')) ? fallback.target : value.target!
  const font = FONTS.some((option) => option.id === value.font) ? value.font! : fallback.font
  const mode = value.mode === 'duration' ? 'duration' : 'until'
  return { mode, target, durationSeconds: normalizeDuration(value.durationSeconds), font, caption: value.caption ?? '', finishedText: value.finishedText ?? '' }
}

function normalizeDuration(seconds: unknown) {
  if (typeof seconds !== 'number' || !Number.isInteger(seconds)) return DEFAULT_DURATION_SECONDS
  return Math.min(MAX_DURATION_SECONDS, Math.max(1, seconds))
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

export function autoFinishedText(timer: Pick<TimerConfig, 'mode' | 'target'>) {
  const target = new Date(timer.target)
  if (timer.mode === 'duration') return 'Time’s up'
  if (isAtMinute(target, 12)) return 'It’s noon'
  if (isAtMinute(target, 0)) return 'It’s midnight'
  return 'Time’s up'
}

export function autoTimerCaption(timer: Pick<TimerConfig, 'mode' | 'target'>) {
  return timer.mode === 'duration' ? 'time left' : autoCaption(new Date(timer.target))
}

export function resolveCaption(timer: TimerConfig) {
  return timer.caption.trim() || autoTimerCaption(timer)
}

export function resolveFinishedText(timer: TimerConfig) {
  return timer.finishedText.trim() || autoFinishedText(timer)
}
