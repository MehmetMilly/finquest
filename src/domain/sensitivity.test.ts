import { describe, expect, it } from 'vitest'
import { ASSUMPTIONS } from '../data/assumptions'
import { primaryProfile } from '../data/mockProfiles'
import { buildSensitivityAnalyses, createSensitivityPresets } from './sensitivity'
import { simulateScenarios } from './simulationEngine'

describe('deterministic sensitivity analysis', () => {
  it('uses three transparent assumption presets without mutating the baseline', () => {
    const before = { ...ASSUMPTIONS }
    const presets = createSensitivityPresets(ASSUMPTIONS)

    expect(presets.map((preset) => preset.id)).toEqual([
      'higher_inflation',
      'slower_income_growth',
      'lower_investment_return',
    ])
    expect(presets.every((preset) => preset.changes.length === 1)).toBe(true)
    expect(ASSUMPTIONS).toEqual(before)
  })

  it('reuses the simulation engine for the active scenario and stays deterministic', () => {
    const first = buildSensitivityAnalyses(primaryProfile, ASSUMPTIONS, undefined, 'delay')
    const second = buildSensitivityAnalyses(primaryProfile, ASSUMPTIONS, undefined, 'delay')

    expect(first).toEqual(second)
    expect(first.baselineResults).toEqual(simulateScenarios(primaryProfile))
    expect(first.analyses).toHaveLength(3)
    for (const analysis of first.analyses) {
      const direct = simulateScenarios(primaryProfile, analysis.preset.assumptions).find((result) => result.id === 'delay')
      expect(analysis.selected.variant).toEqual(direct)
      expect(analysis.selected.netWorthDelta).toBe(direct!.netWorth - analysis.selected.baseline.netWorth)
    }
  })

  it('does not invent a timing delta when a modeled goal is unreachable', () => {
    const analyses = buildSensitivityAnalyses(
      primaryProfile,
      { ...ASSUMPTIONS, homeDepositGoal: 1_000_000_000_000 },
      undefined,
      'finance',
    )

    expect(analyses.analyses.every((analysis) => analysis.selected.goalReachedMonthDelta === null)).toBe(true)
  })
})
