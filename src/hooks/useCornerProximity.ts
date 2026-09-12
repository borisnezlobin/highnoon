import { useEffect, useState } from 'react'

const CORNER_WIDTH = 320
const CORNER_HEIGHT = 200

function isNearBottomRight(event: PointerEvent) {
  return event.clientX > window.innerWidth - CORNER_WIDTH && event.clientY > window.innerHeight - CORNER_HEIGHT
}

export function useCornerProximity() {
  const [isNear, setIsNear] = useState(false)

  useEffect(() => {
    const update = (event: PointerEvent) => setIsNear(isNearBottomRight(event))
    const clear = () => setIsNear(false)
    window.addEventListener('pointermove', update)
    window.addEventListener('pointerdown', update)
    document.documentElement.addEventListener('pointerleave', clear)
    return () => {
      window.removeEventListener('pointermove', update)
      window.removeEventListener('pointerdown', update)
      document.documentElement.removeEventListener('pointerleave', clear)
    }
  }, [])

  return isNear
}
