import { ArrowsInIcon, ArrowsOutIcon } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCornerProximity } from './hooks/useCornerProximity'
import { useFullscreen } from './hooks/useFullscreen'
import { useIdlePointer } from './hooks/useIdlePointer'
import { useNow } from './hooks/useNow'
import { useWakeLock } from './hooks/useWakeLock'
import { CountdownCanvas } from './scene/CountdownCanvas'
import type { SceneTimer } from './scene/countdownScene'
import { TimerSettings } from './settings/TimerSettings'
import { fontById } from './timer/fonts'
import { describeTimeLeft, formatClock, getTimeLeft } from './timer/timeLeft'
import { loadRootTimer, resolveCaption, resolveFinishedText, saveRootTimer, type TimerConfig } from './timer/timerConfig'
import { useRoute } from './timer/useRoute'
import { Button } from './ui/Button'

const MISSING_TIMER: SceneTimer = {
  targetMs: 0,
  caption: 'Double-check the link and try again',
  finishedText: 'No timer here',
  font: fontById('bricolage'),
}

function toSceneTimer(timer: TimerConfig): SceneTimer {
  return {
    targetMs: Date.parse(timer.target),
    caption: resolveCaption(timer),
    finishedText: resolveFinishedText(timer),
    font: fontById(timer.font),
  }
}

function FallbackClock({ timer, now }: { timer: SceneTimer; now: number }) {
  const timeLeft = getTimeLeft(now, timer.targetMs)
  return (
    <div aria-hidden="true" className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-8xl font-bold tabular-nums sm:text-9xl" style={{ fontFamily: timer.font.family }}>
        {timeLeft.isFinished ? timer.finishedText : formatClock(timeLeft)}
      </p>
      <p className="text-xl font-medium">{timer.caption}</p>
    </div>
  )
}

type ScreenProps = { timer: SceneTimer; renderSettings?: (isVisible: boolean) => ReactNode }

function TimerScreen({ timer, renderSettings }: ScreenProps) {
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
        {describeTimeLeft(getTimeLeft(now, timer.targetMs), timer.caption, timer.finishedText)}
      </p>
      {isCanvasUnavailable ? <FallbackClock timer={timer} now={now} /> : <CountdownCanvas timer={timer} onUnavailable={handleUnavailable} />}
      <div className="fixed right-5 bottom-5 flex items-center gap-2">
        {renderSettings?.(isNearCorner)}
        <Button
          variant="floating"
          onClick={toggleFullscreen}
          data-hidden={hideFloatingControls}
          className="pl-3.5 data-[hidden=true]:not-focus-visible:pointer-events-none data-[hidden=true]:not-focus-visible:opacity-0"
        >
          <FullscreenIcon size={18} weight="bold" aria-hidden="true" />
          {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </Button>
      </div>
    </main>
  )
}

function RootTimer() {
  const [timer, setTimer] = useState(loadRootTimer)
  const sceneTimer = useMemo(() => toSceneTimer(timer), [timer])

  useEffect(() => saveRootTimer(timer), [timer])

  return <TimerScreen timer={sceneTimer} renderSettings={(isVisible) => <TimerSettings timer={timer} onChange={setTimer} isVisible={isVisible} />} />
}

function SharedTimer({ timer }: { timer: TimerConfig }) {
  const sceneTimer = useMemo(() => toSceneTimer(timer), [timer])
  return <TimerScreen timer={sceneTimer} />
}

export default function App() {
  const route = useRoute()
  if (route.kind === 'loading') return <main className="h-full" />
  if (route.kind === 'shared') return <SharedTimer timer={route.timer} />
  if (route.kind === 'missing') return <TimerScreen timer={MISSING_TIMER} />
  return <RootTimer />
}
