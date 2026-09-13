import { FirebaseError } from 'firebase/app'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import { normalizeTimer, type TimerConfig } from './timerConfig'

const COLLECTION = 'timers'

export class LinkTakenError extends Error {}

export async function fetchSharedTimer(slug: string): Promise<TimerConfig | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, slug))
  return snapshot.exists() ? normalizeTimer(snapshot.data() as Partial<TimerConfig>) : null
}

export async function createSharedTimer(slug: string, timer: TimerConfig) {
  const reference = doc(db, COLLECTION, slug)
  if ((await getDoc(reference)).exists()) throw new LinkTakenError()
  try {
    await setDoc(reference, {
      mode: timer.mode,
      target: timer.target,
      durationSeconds: timer.durationSeconds,
      caption: timer.caption.trim(),
      finishedText: timer.finishedText.trim(),
      font: timer.font,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') throw new LinkTakenError()
    throw error
  }
}
