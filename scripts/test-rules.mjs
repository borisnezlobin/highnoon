import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, doc, getDoc, getDocs, collection, serverTimestamp, setDoc, updateDoc, deleteDoc, getFirestore } from 'firebase/firestore/lite'

const app = initializeApp({ projectId: 'timer-c247f', apiKey: 'emulator' })
const db = getFirestore(app)
connectFirestoreEmulator(db, '127.0.0.1', 8080)

const validTimer = () => ({ mode: 'until', target: '2026-10-02T22:00:00.000Z', durationSeconds: 900, caption: 'until the demo', finishedText: '', font: 'unbounded', createdAt: serverTimestamp() })

async function expectAllowed(name, action) {
  try {
    await action()
    console.log(`pass  allowed: ${name}`)
    return true
  } catch (error) {
    console.log(`FAIL  expected allowed: ${name} (${error.code})`)
    return false
  }
}

async function expectDenied(name, action) {
  try {
    await action()
    console.log(`FAIL  expected denied: ${name}`)
    return false
  } catch (error) {
    const denied = error.code === 'permission-denied'
    console.log(`${denied ? 'pass' : 'FAIL'}  denied: ${name}${denied ? '' : ` (${error.code})`}`)
    return denied
  }
}

const results = [
  await expectAllowed('create a new link', () => setDoc(doc(db, 'timers', 'team-demo'), validTimer())),
  await expectAllowed('read a link', () => getDoc(doc(db, 'timers', 'team-demo'))),
  await expectAllowed('read a missing link', () => getDoc(doc(db, 'timers', 'nobody-here'))),
  await expectDenied('overwrite an existing link', () => setDoc(doc(db, 'timers', 'team-demo'), validTimer())),
  await expectDenied('update an existing link', () => updateDoc(doc(db, 'timers', 'team-demo'), { caption: 'hijacked' })),
  await expectDenied('delete a link', () => deleteDoc(doc(db, 'timers', 'team-demo'))),
  await expectDenied('list every link', () => getDocs(collection(db, 'timers'))),
  await expectDenied('invalid link name', () => setDoc(doc(db, 'timers', 'Bad Name'), validTimer())),
  await expectDenied('reserved link name', () => setDoc(doc(db, 'timers', 'assets'), validTimer())),
  await expectDenied('unknown font', () => setDoc(doc(db, 'timers', 'bad-font'), { ...validTimer(), font: 'comic-sans' })),
  await expectAllowed('create a time-left link', () => setDoc(doc(db, 'timers', 'talk-timer'), { ...validTimer(), mode: 'duration', durationSeconds: 600 })),
  await expectDenied('unknown mode', () => setDoc(doc(db, 'timers', 'bad-mode'), { ...validTimer(), mode: 'stopwatch' })),
  await expectDenied('duration over a day', () => setDoc(doc(db, 'timers', 'too-long'), { ...validTimer(), durationSeconds: 86401 })),
  await expectDenied('fractional duration', () => setDoc(doc(db, 'timers', 'fraction'), { ...validTimer(), durationSeconds: 1.5 })),
  await expectDenied('extra field', () => setDoc(doc(db, 'timers', 'extra-field'), { ...validTimer(), admin: true })),
  await expectDenied('caption too long', () => setDoc(doc(db, 'timers', 'long-caption'), { ...validTimer(), caption: 'x'.repeat(121) })),
  await expectDenied('client-chosen timestamp', () => setDoc(doc(db, 'timers', 'fake-time'), { ...validTimer(), createdAt: new Date(0) })),
  await expectDenied('write outside timers', () => setDoc(doc(db, 'secrets', 'x'), { a: 1 })),
]

const failures = results.filter((passed) => !passed).length
console.log(failures === 0 ? `\nAll ${results.length} rule checks passed` : `\n${failures} rule checks failed`)
process.exit(failures === 0 ? 0 : 1)
