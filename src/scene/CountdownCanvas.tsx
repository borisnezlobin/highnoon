import { useEffect, useRef, useState } from 'react'
import { loadFont } from '../timer/fonts'
import { CountdownScene, type SceneTimer } from './countdownScene'
import { useReducedMotion } from './useReducedMotion'

type Props = { timer: SceneTimer; onUnavailable: () => void }

export function CountdownCanvas({ timer, onUnavailable }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<CountdownScene | null>(null)
  const initialTimer = useRef(timer)
  const [isReady, setIsReady] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    let scene: CountdownScene | null = null
    let cancelled = false
    loadFont(initialTimer.current.font).then(() => {
      if (cancelled || !canvasRef.current) return
      try {
        scene = new CountdownScene(canvasRef.current, initialTimer.current)
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
    let cancelled = false
    loadFont(timer.font).then(() => {
      if (!cancelled) sceneRef.current?.setTimer(timer)
    })
    return () => {
      cancelled = true
    }
  }, [timer, isReady])

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
