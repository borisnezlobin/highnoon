import { useCallback, useEffect, useMemo, useState } from 'react'

export type DurationRun =
  | { kind: 'running'; endsAt: number; durationSeconds: number }
  | { kind: 'paused'; remainingMs: number; durationSeconds: number }

export type DurationControls = {
  run: DurationRun
  isReady: boolean
  toggle: () => void
  reset: () => void
}

function readyRun(durationSeconds: number): DurationRun {
  return { kind: 'paused', remainingMs: durationSeconds * 1000, durationSeconds }
}

function loadRun(storageKey: string, durationSeconds: number): DurationRun {
  try {
    const saved: DurationRun | null = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    return saved?.durationSeconds === durationSeconds ? saved : readyRun(durationSeconds)
  } catch {
    return readyRun(durationSeconds)
  }
}

export function remainingMsFor(run: DurationRun, now: number) {
  return run.kind === 'running' ? run.endsAt - now : run.remainingMs
}

export function useDurationRun(scope: string, durationSeconds: number): DurationControls {
  const storageKey = `highnoon.run.${scope}`
  const [run, setRun] = useState(() => loadRun(storageKey, durationSeconds))
  const currentRun = useMemo(() => (run.durationSeconds === durationSeconds ? run : readyRun(durationSeconds)), [run, durationSeconds])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(currentRun))
    } catch {
      // Without storage the run simply restarts on reload.
    }
  }, [storageKey, currentRun])

  const toggle = useCallback(() => {
    setRun((previous) => {
      const active = previous.durationSeconds === durationSeconds ? previous : readyRun(durationSeconds)
      const now = Date.now()
      if (active.kind === 'running') return { kind: 'paused', remainingMs: Math.max(0, active.endsAt - now), durationSeconds }
      const remainingMs = active.remainingMs > 0 ? active.remainingMs : durationSeconds * 1000
      return { kind: 'running', endsAt: now + remainingMs, durationSeconds }
    })
  }, [durationSeconds])

  const reset = useCallback(() => setRun(readyRun(durationSeconds)), [durationSeconds])

  return useMemo(() => {
    const isReady = currentRun.kind === 'paused' && currentRun.remainingMs === durationSeconds * 1000
    return { run: currentRun, isReady, toggle, reset }
  }, [currentRun, durationSeconds, toggle, reset])
}
