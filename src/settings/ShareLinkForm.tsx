import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { SITE_HOST, isValidSlug, type TimerConfig } from '../timer/timerConfig'

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; slug: string } | { kind: 'failed'; message: string }

async function saveSharedTimer(slug: string, timer: TimerConfig) {
  const response = await fetch('/__timers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, timer }),
  })
  if (!response.ok) throw new Error(await response.text())
}

function StatusMessage({ status }: { status: Status }) {
  if (status.kind === 'saved') {
    return (
      <>
        Saved. <a className="font-medium underline underline-offset-2" href={`/${status.slug}`} target="_blank" rel="noreferrer">Preview it</a>, then run <code className="font-mono">npm run deploy</code> to put it online.
      </>
    )
  }
  if (status.kind === 'failed') return <>Couldn’t save that link: {status.message}</>
  return null
}

export function ShareLinkForm({ timer }: { timer: TimerConfig }) {
  const [slug, setSlug] = useState('')
  const [slugError, setSlugError] = useState<string>()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isValidSlug(slug)) {
      setSlugError('Use lowercase letters, numbers and dashes, like team-demo.')
      return
    }
    setSlugError(undefined)
    setStatus({ kind: 'saving' })
    try {
      await saveSharedTimer(slug, timer)
      setStatus({ kind: 'saved', slug })
    } catch (error) {
      setStatus({ kind: 'failed', message: error instanceof Error ? error.message : 'unknown error' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <h3 className="font-semibold">Share link</h3>
      <TextField
        label="Link name"
        prefix={`${SITE_HOST}/`}
        value={slug}
        onChange={(event) => setSlug(event.target.value.toLowerCase())}
        error={slugError}
        hint="People who open this link see the countdown without any settings."
        autoComplete="off"
        spellCheck={false}
      />
      <Button type="submit" disabled={status.kind === 'saving'} className="self-start">
        {status.kind === 'saving' ? 'Saving…' : 'Save link'}
      </Button>
      <p role="status" className="text-sm text-pretty text-muted">
        <StatusMessage status={status} />
      </p>
    </form>
  )
}
