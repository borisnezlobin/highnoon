import { ArrowsInIcon, ArrowsOutIcon } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCornerProximity } from './hooks/useCornerProximity'
import { useFullscreen } from './hooks/useFullscreen'
import { useIdlePointer } from './hooks/useIdlePointer'
import { useNow } from './hooks/useNow'
import { useWakeLock } from './hooks/useWakeLock'
import { RunControls } from './RunControls'
import { CountdownCanvas } from './scene/CountdownCanvas'
import type { SceneTimer } from './scene/countdownScene'
import { TimerSettings } from './settings/TimerSettings'
import { fontById } from './timer/fonts'
import { describeTimeLeft, formatClock, getTimeLeft } from './timer/timeLeft'
import { loadRootTimer, resolveCaption, resolveFinishedText, saveRootTimer, type TimerConfig } from './timer/timerConfig'
import { remainingMsFor, useDurationRun, type DurationControls } from './timer/useDurationRun'
import { useRoute } from './timer/useRoute'
import { Button } from './ui/Button'

const HIDDEN_WHEN_IDLE = 'data-[hidden=true]:not-focus-visible:pointer-events-none data-[hidden=true]:not-focus-visible:opacity-0'

const MISSING_TIMER: SceneTimer = {
  remainingMs: () => 0,
  isPaused: false,
  showHours: true,
  caption: 'Double-check the link and try again',
  finishedText: 'No timer here',
  font: fontById('bricolage'),
}

function durationCaption(timer: TimerConfig, controls: DurationControls) {
  const isMidwayPause = controls.run.kind === 'paused' && !controls.isReady && controls.run.remainingMs > 0
  return isMidwayPause ? 'Paused' : resolveCaption(timer)
}

function toSceneTimer(timer: TimerConfig, controls: DurationControls): SceneTimer {
  const shared = { finishedText: resolveFinishedText(timer), font: fontById(timer.font) }
  if (timer.mode === 'until') {
    const targetMs = Date.parse(timer.target)
    return { ...shared, caption: resolveCaption(timer), remainingMs: (now) => targetMs - now, isPaused: false, showHours: true }
  }
  const { run } = controls
  return {
    ...shared,
    caption: durationCaption(timer, controls),
    remainingMs: (now) => remainingMsFor(run, now),
    isPaused: run.kind === 'paused',
    showHours: timer.durationSeconds >= 3600,
  }
}

function useTimer(timer: TimerConfig, scope: string) {
  const controls = useDurationRun(scope, timer.durationSeconds)
  const sceneTimer = useMemo(() => toSceneTimer(timer, controls), [timer, controls])
  return { sceneTimer, controls: timer.mode === 'duration' ? controls : null }
}

function FallbackClock({ timer, now }: { timer: SceneTimer; now: number }) {
  const timeLeft = getTimeLeft(timer.remainingMs(now))
  return (
    <div aria-hidden="true" className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-8xl font-bold tabular-nums sm:text-9xl" style={{ fontFamily: timer.font.family }}>
        {timeLeft.isFinished ? timer.finishedText : formatClock(timeLeft, timer.showHours)}
      </p>
      <p className="text-xl font-medium">{timer.caption}</p>
    </div>
  )
}

type ScreenProps = {
  timer: SceneTimer
  controls?: DurationControls | null
  renderSettings?: (isVisible: boolean) => ReactNode
}

function TimerScreen({ timer, controls, renderSettings }: ScreenProps) {
  const now = useNow(1000)
  const isIdle = useIdlePointer(2500)
  const isNearCorner = useCornerProximity()
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const [isCanvasUnavailable, setIsCanvasUnavailable] = useState(false)
  const handleUnavailable = useCallback(() => setIsCanvasUnavailable(true), [])
  useWakeLock(isFullscreen)

  const FullscreenIcon = isFullscreen ? ArrowsInIcon : ArrowsOutIcon
  const hideFloatingControls = isIdle && !isNearCorner

  return (
    <main data-idle={hideFloatingControls} className="h-full data-[idle=true]:cursor-none">
      <h1 className="sr-only">Countdown</h1>
      <p role="timer" className="sr-only">
        {describeTimeLeft(getTimeLeft(timer.remainingMs(now)), timer.caption, timer.finishedText)}
      </p>
      {isCanvasUnavailable ? <FallbackClock timer={timer} now={now} /> : <CountdownCanvas timer={timer} onUnavailable={handleUnavailable} />}
      <div className="fixed right-5 bottom-5 flex flex-wrap items-center justify-end gap-2 pl-5">
        {controls && <RunControls controls={controls} isHidden={hideFloatingControls} hiddenClass={HIDDEN_WHEN_IDLE} />}
        {renderSettings?.(isNearCorner)}
        <Button variant="floating" onClick={toggleFullscreen} data-hidden={hideFloatingControls} className={`pl-3.5 ${HIDDEN_WHEN_IDLE}`}>
          <FullscreenIcon size={18} weight="bold" aria-hidden="true" />
          {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </Button>
      </div>
    </main>
  )
}

function RootTimer() {
  const [timer, setTimer] = useState(loadRootTimer)
  const { sceneTimer, controls } = useTimer(timer, 'root')

  useEffect(() => saveRootTimer(timer), [timer])

  return (
    <TimerScreen
      timer={sceneTimer}
      controls={controls}
      renderSettings={(isVisible) => <TimerSettings timer={timer} onChange={setTimer} isVisible={isVisible} />}
    />
  )
}

function SharedTimer({ slug, timer }: { slug: string; timer: TimerConfig }) {
  const { sceneTimer, controls } = useTimer(timer, `link.${slug}`)
  return <TimerScreen timer={sceneTimer} controls={controls} />
}

export default function App() {
  const route = useRoute()
  if (route.kind === 'loading') return <main className="h-full" />
  if (route.kind === 'shared') return <SharedTimer slug={route.slug} timer={route.timer} />
  if (route.kind === 'missing') return <TimerScreen timer={MISSING_TIMER} />
  return <RootTimer />
}
