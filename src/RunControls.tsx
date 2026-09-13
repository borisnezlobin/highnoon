import { ArrowCounterClockwiseIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react'
import { useEffect } from 'react'
import { isKeyboardFocusedButton, isPlainKey } from './hooks/keyboard'
import type { DurationControls } from './timer/useDurationRun'
import { Button } from './ui/Button'

type Props = { controls: DurationControls; hiddenClass: string; isHidden: boolean }

function toggleLabel({ run, isReady }: DurationControls) {
  if (run.kind === 'running') return 'Pause'
  return isReady ? 'Start' : 'Resume'
}

export function RunControls({ controls, hiddenClass, isHidden }: Props) {
  const { toggle, reset, run } = controls

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!isPlainKey(event)) return
      if (event.key === ' ' && !isKeyboardFocusedButton(event.target)) {
        event.preventDefault()
        toggle()
      }
      if (event.key.toLowerCase() === 'r') reset()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [toggle, reset])

  const ToggleIcon = run.kind === 'running' ? PauseIcon : PlayIcon

  return (
    <>
      <Button variant="floating" onClick={reset} disabled={controls.isReady} data-hidden={isHidden} className={`pl-3.5 ${hiddenClass}`}>
        <ArrowCounterClockwiseIcon size={18} weight="bold" aria-hidden="true" />
        Reset
      </Button>
      <Button variant="floating" onClick={toggle} data-hidden={isHidden} className={`pl-3.5 ${hiddenClass}`}>
        <ToggleIcon size={18} weight="fill" aria-hidden="true" />
        {toggleLabel(controls)}
      </Button>
    </>
  )
}
