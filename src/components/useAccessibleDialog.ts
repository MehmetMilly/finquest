import { useEffect, useRef, type RefObject } from 'react'
import { getFocusableElements } from './dialogFocus'

export interface AccessibleDialogOptions {
  open: boolean
  onClose: () => void
  dialogRef: RefObject<HTMLElement | null>
  initialFocusRef?: RefObject<HTMLElement | null>
}

function focusElement(element: HTMLElement | null | undefined) {
  if (!element || !element.isConnected) return
  try {
    element.focus({ preventScroll: true })
  } catch {
    element.focus()
  }
}

function restoreBackgroundIsolation(host: HTMLElement) {
  const background = Array.from(document.body.children)
    .filter((element): element is HTMLElement => element !== host && element instanceof HTMLElement)
  const previous = background.map((element) => ({
    element,
    inert: element.inert,
    ariaHidden: element.getAttribute('aria-hidden'),
  }))

  for (const element of background) {
    element.inert = true
    element.setAttribute('aria-hidden', 'true')
  }

  return () => {
    for (const item of previous) {
      item.element.inert = item.inert
      if (item.ariaHidden === null) item.element.removeAttribute('aria-hidden')
      else item.element.setAttribute('aria-hidden', item.ariaHidden)
    }
  }
}

/**
 * Applies the keyboard and background contract shared by the assumptions and
 * future-self dialogs. The trigger is captured on open and restored after the
 * modal unmounts, which also covers close buttons, scrims, Escape, and parent
 * controlled state changes.
 */
export function useAccessibleDialog({ open, onClose, dialogRef, initialFocusRef }: AccessibleDialogOptions) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    let cancelled = false
    let isolationCleanup: (() => void) | null = null
    let isolationTimer: number | null = null
    let focusTimer: number | null = null
    let focusFrame: number | null = null

    const focusInitialTarget = () => {
      if (cancelled) return
      const root = dialogRef.current
      if (!root) return
      focusElement(initialFocusRef?.current ?? getFocusableElements(root)[0] ?? root)
    }

    const isolateBackground = () => {
      if (cancelled) return
      const dialog = dialogRef.current
      const host = dialog?.closest<HTMLElement>('[data-dialog-host]')
      if (!dialog || !host || !document.body.contains(host)) {
        isolationTimer = window.setTimeout(isolateBackground, 0)
        return
      }
      isolationCleanup = restoreBackgroundIsolation(host)
    }

    isolateBackground()
    if (typeof window.requestAnimationFrame === 'function') focusFrame = window.requestAnimationFrame(focusInitialTarget)
    else focusTimer = window.setTimeout(focusInitialTarget, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      const root = dialogRef.current
      if (!root || !root.contains(event.target as Node)) return

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = getFocusableElements(root)
      if (focusable.length === 0) {
        event.preventDefault()
        focusElement(root)
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement
      if (event.shiftKey && (current === first || !root.contains(current))) {
        event.preventDefault()
        focusElement(last)
      } else if (!event.shiftKey && (current === last || !root.contains(current))) {
        event.preventDefault()
        focusElement(first)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      cancelled = true
      document.removeEventListener('keydown', handleKeyDown, true)
      if (isolationTimer !== null) window.clearTimeout(isolationTimer)
      if (focusTimer !== null) window.clearTimeout(focusTimer)
      if (focusFrame !== null && typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(focusFrame)
      isolationCleanup?.()
      focusElement(previousFocus)
    }
  }, [dialogRef, initialFocusRef, open])
}

