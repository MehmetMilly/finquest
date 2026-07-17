import { describe, expect, it, vi } from 'vitest'
import { primaryProfile } from '../data/mockProfiles'
import { simulateScenarios } from '../domain/simulationEngine'
import {
  buildCompactNarrativeFacts,
  createDeterministicNarrativeFallback,
  requestGroundedNarrative,
} from './narrative'

describe('narrative facts and deterministic fallback', () => {
  it('builds a compact calculated snapshot without profile identifiers', () => {
    const facts = buildCompactNarrativeFacts(simulateScenarios(primaryProfile), 'finance', 'monthly_room')

    expect(facts).not.toBeNull()
    expect(facts?.scenarioId).toBe('finance')
    expect(facts).not.toHaveProperty('name')
    expect(facts).not.toHaveProperty('profile')
    expect(facts?.scenario.averageMonthlyVehicleObligation).toBeGreaterThan(0)
    expect(facts?.comparison.netWorthDifference).toBeGreaterThanOrEqual(0)
  })

  it('gives a fully local calculated response for every supported focus', () => {
    const results = simulateScenarios(primaryProfile)
    const focuses = ['monthly_room', 'emergency_fund', 'comparison'] as const

    for (const focus of focuses) {
      const facts = buildCompactNarrativeFacts(results, 'used', focus)
      expect(facts).not.toBeNull()
      const reply = createDeterministicNarrativeFallback(facts!)
      expect(reply.source).toBe('fallback')
      expect(reply.text.length).toBeGreaterThan(20)
    }
  })

  it('keeps the local fallback when the same-origin route is unavailable', async () => {
    const facts = buildCompactNarrativeFacts(simulateScenarios(primaryProfile), 'delay', 'comparison')!
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue({ ok: false } as Response)

    const reply = await requestGroundedNarrative(facts, { fetchImpl })

    expect(fetchImpl).toHaveBeenCalledOnce()
    expect(reply).toEqual(createDeterministicNarrativeFallback(facts))
  })
})
