import { ArrowsInIcon, ArrowsOutIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

function toggleFullscreen() {
  if (document.fullscreenElement) return document.exitFullscreen()
  return document.documentElement.requestFullscreen()
}

export function FullscreenButton({ isHidden }: { isHidden: boolean }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'f' && !event.metaKey && !event.ctrlKey) toggleFullscreen()
    }
    document.addEventListener('fullscreenchange', sync)
    window.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      window.removeEventListener('keydown', handleKey)
    }
  }, [])

  const Icon = isFullscreen ? ArrowsInIcon : ArrowsOutIcon

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      data-hidden={isHidden}
      className="fixed right-5 bottom-5 flex h-10 items-center gap-2 rounded-full bg-control/90 pr-4 pl-3.5 text-sm font-medium text-control-text shadow-lg transition-[opacity,scale] duration-300 ease-standard outline-none select-none active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ground data-[hidden=true]:not-focus-visible:pointer-events-none data-[hidden=true]:not-focus-visible:opacity-0"
    >
      <Icon size={18} weight="bold" aria-hidden="true" />
      {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
    </button>
  )
}
