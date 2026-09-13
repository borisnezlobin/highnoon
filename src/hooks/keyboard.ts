export function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && target.closest('input, textarea, select, dialog[open]') !== null
}

export function isPlainKey(event: KeyboardEvent) {
  return !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)
}

export function isKeyboardFocusedButton(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button')?.matches(':focus-visible'))
}
