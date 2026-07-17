import { describe, expect, it } from 'vitest'
import { commitNumericDraft } from './carDecisionNumeric'

describe('car decision numeric drafts', () => {
  const bounds = { min: 60_000, max: 400_000 }

  it('keeps a full keyboard replacement after commit', () => {
    expect(commitNumericDraft('180000', bounds, 160_000)).toBe(180_000)
  })

  it('keeps an empty draft while typing and restores the prior value at commit', () => {
    expect(commitNumericDraft('', bounds, 160_000)).toBe(160_000)
    expect(commitNumericDraft('   ', bounds, 160_000)).toBe(160_000)
  })

  it('uses the same commit path for blur and Enter', () => {
    const draft = '275000'
    const blurValue = commitNumericDraft(draft, bounds, 160_000)
    const enterValue = commitNumericDraft(draft, bounds, 160_000)
    expect(enterValue).toBe(blurValue)
  })

  it('restores the last valid value for malformed text', () => {
    expect(commitNumericDraft('not a number', bounds, 160_000)).toBe(160_000)
    expect(commitNumericDraft('Infinity', bounds, 160_000)).toBe(160_000)
  })

  it('clamps against the bounds that exist at commit time', () => {
    expect(commitNumericDraft('90000', { min: 0, max: 70_000 }, 10_000)).toBe(70_000)
    expect(commitNumericDraft('90000', { min: 0, max: 100_000 }, 10_000)).toBe(90_000)
    expect(commitNumericDraft('90000', { min: 0, max: 50_000 }, 10_000)).toBe(50_000)
  })
})
