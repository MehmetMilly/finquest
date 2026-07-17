export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function getFocusableElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.hidden || element.tabIndex < 0) return false
    if (element.getAttribute('aria-hidden') === 'true') return false
    if (element.closest('[aria-hidden="true"], [inert]')) return false
    if ('disabled' in element && Boolean((element as HTMLButtonElement).disabled)) return false
    return true
  })
}

