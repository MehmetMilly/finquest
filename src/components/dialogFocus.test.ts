import { describe, expect, it } from 'vitest'
import { FOCUSABLE_SELECTOR, getFocusableElements } from './dialogFocus'

interface FakeElement {
  hidden: boolean
  tabIndex: number
  disabled: boolean
  getAttribute: (name: string) => string | null
  closest: () => null
}

interface FakeElementOptions {
  tabIndex?: number
  ariaHidden?: string | null
  hidden?: boolean
  disabled?: boolean
}

function fakeElement({ tabIndex = 0, ariaHidden = null, hidden = false, disabled = false }: FakeElementOptions = {}): FakeElement {
  return {
    hidden,
    tabIndex,
    disabled,
    getAttribute: (name) => name === 'aria-hidden' ? ariaHidden : null,
    closest: () => null,
  }
}

describe('accessible dialog focus utility', () => {
  it('recognizes the interactive controls used by both modal surfaces', () => {
    expect(FOCUSABLE_SELECTOR).toContain('button')
    expect(FOCUSABLE_SELECTOR).toContain('input')
    expect(FOCUSABLE_SELECTOR).toContain('[tabindex]')
  })

  it('omits hidden, disabled, and negative-tab-index scrim-like elements', () => {
    const close = fakeElement()
    const hidden = fakeElement({ ariaHidden: 'true' })
    const disabled = fakeElement({ disabled: true })
    const untabbable = fakeElement({ tabIndex: -1 })
    const root = { querySelectorAll: () => [close, hidden, disabled, untabbable] } as unknown as ParentNode

    expect(getFocusableElements(root)).toEqual([close])
  })
})
