import { useCallback, useEffect, useState } from 'react'

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && target.closest('input, textarea, select, dialog[open]') !== null
}

function wantsFullscreenShortcut(event: KeyboardEvent) {
  return event.key.toLowerCase() === 'f' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)
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
