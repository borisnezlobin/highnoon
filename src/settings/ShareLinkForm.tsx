import { ArrowSquareOutIcon, CheckIcon, CopyIcon } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { LinkTakenError, createSharedTimer } from '../timer/sharedTimers'
import { SITE_HOST, isValidSlug, type TimerConfig } from '../timer/timerConfig'

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'created'; slug: string } | { kind: 'failed' }

const INVALID_SLUG_MESSAGE = 'Use lowercase letters, numbers and dashes, like team-demo.'
const TAKEN_SLUG_MESSAGE = 'Someone already has that link name. Try another one.'

function CreatedLink({ slug }: { slug: string }) {
  const [hasCopied, setHasCopied] = useState(false)
  const url = `https://${SITE_HOST}/${slug}`
  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setHasCopied(true)
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-ground/60 p-3">
      <p className="text-sm text-pretty">
        Your link is live. It shows this countdown without any settings, and later changes here won’t affect it.
      </p>
      <a href={`/${slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-medium break-all underline underline-offset-2">
        {SITE_HOST}/{slug}
        <ArrowSquareOutIcon size={16} weight="bold" aria-hidden="true" className="shrink-0" />
      </a>
      <Button onClick={copy} className="self-start pl-3.5">
        {hasCopied ? <CheckIcon size={16} weight="bold" aria-hidden="true" /> : <CopyIcon size={16} weight="bold" aria-hidden="true" />}
        {hasCopied ? 'Copied' : 'Copy link'}
      </Button>
    </div>
  )
}

export function ShareLinkForm({ timer }: { timer: TimerConfig }) {
  const [slug, setSlug] = useState('')
  const [slugError, setSlugError] = useState<string>()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isValidSlug(slug)) {
      setSlugError(INVALID_SLUG_MESSAGE)
      return
    }
    setSlugError(undefined)
    setStatus({ kind: 'saving' })
    try {
      await createSharedTimer(slug, timer)
      setStatus({ kind: 'created', slug })
    } catch (error) {
      if (error instanceof LinkTakenError) setSlugError(TAKEN_SLUG_MESSAGE)
      setStatus({ kind: error instanceof LinkTakenError ? 'idle' : 'failed' })
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
        hint="Anyone with the link sees the countdown, without the settings."
        autoComplete="off"
        spellCheck={false}
      />
      <Button type="submit" disabled={status.kind === 'saving'} className="self-start">
        {status.kind === 'saving' ? 'Creating link…' : 'Create link'}
      </Button>
      <div role="status" className="text-sm text-pretty">
        {status.kind === 'created' && <CreatedLink slug={status.slug} />}
        {status.kind === 'failed' && <p className="text-signal">Couldn’t create the link. Check your connection and try again.</p>}
      </div>
    </form>
  )
}
