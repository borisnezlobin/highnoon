import { getAnalytics, isSupported } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore/lite'

const firebaseConfig = {
  apiKey: 'AIzaSyCvIwmWRwPhG_lle0V8A-ZAhrETVc1rK_k',
  authDomain: 'timer-c247f.firebaseapp.com',
  projectId: 'timer-c247f',
  storageBucket: 'timer-c247f.firebasestorage.app',
  messagingSenderId: '205469884778',
  appId: '1:205469884778:web:2a3055a019b384596f8513',
  measurementId: 'G-873MD7BM5R',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const db = getFirestore(firebaseApp)

const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST
if (emulatorHost) {
  const [host, port] = emulatorHost.split(':')
  connectFirestoreEmulator(db, host, Number(port))
}

if (import.meta.env.PROD) {
  isSupported().then((supported) => supported && getAnalytics(firebaseApp))
}
