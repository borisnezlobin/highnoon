import { useEffect, useState } from 'react'

export function useIdlePointer(idleAfterMs: number) {
  const [isIdle, setIsIdle] = useState(true)
  useEffect(() => {
    let timer = 0
    const wake = () => {
      setIsIdle(false)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setIsIdle(true), idleAfterMs)
    }
    window.addEventListener('pointermove', wake)
    window.addEventListener('keydown', wake)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', wake)
      window.removeEventListener('keydown', wake)
    }
  }, [idleAfterMs])
  return isIdle
}
