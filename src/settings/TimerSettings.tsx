import { GearSixIcon, XIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useNow } from '../hooks/useNow'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { CalendarPicker } from './CalendarPicker'
import { FontPicker } from './FontPicker'
import { ShareLinkForm } from './ShareLinkForm'
import { TimePicker } from './TimePicker'
import { MAX_CAPTION_LENGTH, MAX_FINISHED_TEXT_LENGTH, autoFinishedText, autoTimerCaption, type TimerConfig, type TimerMode } from '../timer/timerConfig'
import { SegmentedControl } from '../ui/SegmentedControl'
import { DurationPicker } from './DurationPicker'

type Props = { timer: TimerConfig; onChange: (timer: TimerConfig) => void; isVisible: boolean }

function TargetSummary({ target }: { target: Date }) {
  const now = useNow(15_000)
  const hasPassed = target.getTime() <= now
  return (
    <p className={`text-sm text-pretty ${hasPassed ? 'text-signal' : 'text-muted'}`}>
      {hasPassed
        ? 'That time has already passed, so the timer shows its finished text.'
        : `Ends ${target.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${target.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`}
    </p>
  )
}

const MODE_OPTIONS: { value: TimerMode; label: string }[] = [
  { value: 'until', label: 'Until a time' },
  { value: 'duration', label: 'Time left' },
]

function UntilFields({ target, onChange }: { target: Date; onChange: (date: Date) => void }) {
  return (
    <>
      <CalendarPicker value={target} onChange={onChange} />
      <TimePicker value={target} onChange={onChange} />
      <TargetSummary target={target} />
    </>
  )
}

export function TimerSettings({ timer, onChange, isVisible }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const target = new Date(timer.target)
  const update = (changes: Partial<TimerConfig>) => onChange({ ...timer, ...changes })

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && dialog && !dialog.open) dialog.showModal()
  }, [isOpen])

  const closedWithPointer = useRef(false)

  const close = (event?: MouseEvent<HTMLElement>) => {
    closedWithPointer.current = Boolean(event && event.detail > 0)
    dialogRef.current?.close()
  }

  const handleClose = () => {
    setIsOpen(false)
    if (!closedWithPointer.current) return
    closedWithPointer.current = false
    requestAnimationFrame(() => (document.activeElement as HTMLElement | null)?.blur())
  }

  return (
    <>
      <Button
        variant="floating"
        shape="circle"
        onClick={() => setIsOpen(true)}
        aria-label="Timer settings"
        data-hidden={!isVisible && !isOpen}
        className="data-[hidden=true]:not-focus-visible:pointer-events-none data-[hidden=true]:not-focus-visible:opacity-0"
      >
        <GearSixIcon size={20} weight="bold" aria-hidden="true" />
      </Button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        onClick={(event) => event.target === dialogRef.current && close(event)}
        aria-labelledby="timer-settings-title"
        className="fixed inset-auto right-4 bottom-4 m-0 max-h-[calc(100dvh-2rem)] w-[min(26rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-3xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/15"
      >
        {isOpen && (
          <div className="flex flex-col gap-7 p-5">
            <div className="flex items-center justify-between">
              <h2 id="timer-settings-title" className="text-xl font-semibold">Timer settings</h2>
              <Button variant="quiet" shape="circle" onClick={close} aria-label="Close settings">
                <XIcon size={20} weight="bold" aria-hidden="true" />
              </Button>
            </div>

            <section className="flex flex-col gap-4">
              <h3 className="font-semibold">Count down</h3>
              <SegmentedControl label="Count down" options={MODE_OPTIONS} value={timer.mode} onChange={(mode) => update({ mode })} />
              {timer.mode === 'until' ? <UntilFields target={target} onChange={(date) => update({ target: date.toISOString() })} /> : <DurationPicker value={timer.durationSeconds} onChange={(durationSeconds) => update({ durationSeconds })} />}
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="font-semibold">Text</h3>
              <TextField label="Caption" value={timer.caption} placeholder={autoTimerCaption(timer)} onChange={(event) => update({ caption: event.target.value })} maxLength={MAX_CAPTION_LENGTH} autoComplete="off" />
              <TextField label="When it reaches zero" value={timer.finishedText} placeholder={autoFinishedText(timer)} onChange={(event) => update({ finishedText: event.target.value })} maxLength={MAX_FINISHED_TEXT_LENGTH} autoComplete="off" />
            </section>

            <FontPicker value={timer.font} onChange={(font) => update({ font })} />

            <ShareLinkForm timer={timer} />
          </div>
        )}
      </dialog>
    </>
  )
}
