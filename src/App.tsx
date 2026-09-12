import { useCallback, useState } from 'react'
import { CountdownCanvas } from './scene/CountdownCanvas'
import { FullscreenButton } from './FullscreenButton'
import { useIdlePointer } from './useIdlePointer'
import { useNow } from './useNow'
import { describeTarget, describeTimeLeftForScreenReaders, formatClock, getTimeLeft } from './countdown/target'

function FallbackClock({ now }: { now: number }) {
  const timeLeft = getTimeLeft(now)
  return (
    <div aria-hidden="true" className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-8xl font-bold tabular-nums sm:text-9xl">{timeLeft.isFinished ? 'It’s noon' : formatClock(timeLeft)}</p>
      <p className="text-xl font-medium">{describeTarget()}</p>
    </div>
  )
}

export default function App() {
  const now = useNow(1000)
  const isIdle = useIdlePointer(2500)
  const [isCanvasUnavailable, setIsCanvasUnavailable] = useState(false)
  const handleUnavailable = useCallback(() => setIsCanvasUnavailable(true), [])

  return (
    <main data-idle={isIdle} className="h-full data-[idle=true]:cursor-none">
      <h1 className="sr-only">Countdown to noon</h1>
      <p role="timer" className="sr-only">
        {describeTimeLeftForScreenReaders(getTimeLeft(now))}
      </p>
      {isCanvasUnavailable ? <FallbackClock now={now} /> : <CountdownCanvas onUnavailable={handleUnavailable} />}
      <FullscreenButton isHidden={isIdle} />
    </main>
  )
}
