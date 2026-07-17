import { describe, expect, it } from 'vitest'
import { resolveQuestSelection } from './questRouting'

describe('quest route intent', () => {
  it('opens the exact quest promised by a product CTA', () => {
    expect(resolveQuestSelection('buffer-first', 'car-delay', ['car-delay'])).toBe('buffer-first')
    expect(resolveQuestSelection('car-delay', null, ['buffer-first'])).toBe('car-delay')
  })

  it('keeps recommendation behavior for generic Tasks navigation', () => {
    expect(resolveQuestSelection(null, null, ['car-delay', 'buffer-first'])).toBe('car-delay')
    expect(resolveQuestSelection(undefined, 'buffer-first', ['car-delay'])).toBe('buffer-first')
  })
})
