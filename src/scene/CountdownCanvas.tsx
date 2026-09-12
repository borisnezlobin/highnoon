import { useEffect, useRef, useState } from 'react'
import { loadTextFonts } from './textLayer'
import { CountdownScene } from './countdownScene'
import { useReducedMotion } from './useReducedMotion'

type Props = { onUnavailable: () => void }

export function CountdownCanvas({ onUnavailable }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<CountdownScene | null>(null)
  const [isReady, setIsReady] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    let scene: CountdownScene | null = null
    let cancelled = false
    loadTextFonts().then(() => {
      if (cancelled || !canvasRef.current) return
      try {
        scene = new CountdownScene(canvasRef.current)
      } catch (error) {
        console.error(error)
        onUnavailable()
        return
      }
      sceneRef.current = scene
      scene.start()
      setIsReady(true)
    })
    return () => {
      cancelled = true
      scene?.stop()
    }
  }, [onUnavailable])

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.reducedMotion = reducedMotion
  }, [reducedMotion, isReady])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-ready={isReady}
      className="fixed inset-0 size-full opacity-0 transition-[opacity] duration-1000 ease-standard data-[ready=true]:opacity-100"
    />
  )
}
