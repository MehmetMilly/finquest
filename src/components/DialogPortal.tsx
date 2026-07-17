import { createPortal } from 'react-dom'
import { useLayoutEffect, useMemo, type ReactNode } from 'react'

export interface DialogPortalProps {
  children: ReactNode
}

/**
 * A body-level portal keeps modal layers above the app shell and gives the
 * focus utility one predictable sibling to leave interactive. The host is
 * intentionally unstyled; existing dialog classes continue to own visuals.
 */
export function DialogPortal({ children }: DialogPortalProps) {
  const host = useMemo(() => {
    if (typeof document === 'undefined') return null
    const element = document.createElement('div')
    element.dataset.dialogHost = 'true'
    element.style.display = 'contents'
    return element
  }, [])

  useLayoutEffect(() => {
    if (!host) return
    document.body.appendChild(host)
    return () => host.remove()
  }, [host])

  return host ? createPortal(children, host) : null
}

