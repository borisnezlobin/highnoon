import { useCallback, useEffect, useState } from 'react'
import { isPlainKey } from './keyboard'

function wantsFullscreenShortcut(event: KeyboardEvent) {
  return event.key.toLowerCase() === 'f' && isPlainKey(event)
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement))

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) return document.exitFullscreen()
    return document.documentElement.requestFullscreen()
  }, [])

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    const handleKey = (event: KeyboardEvent) => {
      if (wantsFullscreenShortcut(event)) toggleFullscreen()
    }
    document.addEventListener('fullscreenchange', sync)
    window.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      window.removeEventListener('keydown', handleKey)
    }
  }, [toggleFullscreen])

  return { isFullscreen, toggleFullscreen }
}
