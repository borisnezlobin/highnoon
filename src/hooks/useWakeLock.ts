import { useEffect } from 'react'

export function useWakeLock(isEnabled: boolean) {
  useEffect(() => {
    if (!isEnabled || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let isCancelled = false

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (isCancelled) lock.release()
        else sentinel = lock
      } catch {
        // Low battery or a browser policy can refuse the lock; the timer keeps running either way.
      }
    }

    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      isCancelled = true
      document.removeEventListener('visibilitychange', acquire)
      sentinel?.release()
    }
  }, [isEnabled])
}
