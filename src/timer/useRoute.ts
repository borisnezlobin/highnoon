import { useEffect, useState } from 'react'
import { fetchSharedTimer } from './sharedTimers'
import { isValidSlug, type TimerConfig } from './timerConfig'

export type Route =
  | { kind: 'loading' }
  | { kind: 'root' }
  | { kind: 'shared'; timer: TimerConfig }
  | { kind: 'missing' }

function slugFromPath(pathname: string) {
  return decodeURIComponent(pathname.replace(/^\/+|\/+$/g, '')).toLowerCase()
}

async function loadSharedRoute(slug: string): Promise<Route> {
  try {
    const timer = await fetchSharedTimer(slug)
    return timer ? { kind: 'shared', timer } : { kind: 'missing' }
  } catch {
    return { kind: 'missing' }
  }
}

function initialRoute(slug: string): Route {
  if (!slug) return { kind: 'root' }
  return isValidSlug(slug) ? { kind: 'loading' } : { kind: 'missing' }
}

export function useRoute(): Route {
  const slug = slugFromPath(window.location.pathname)
  const [route, setRoute] = useState<Route>(() => initialRoute(slug))

  useEffect(() => {
    if (slug && isValidSlug(slug)) loadSharedRoute(slug).then(setRoute)
  }, [slug])

  return route
}
