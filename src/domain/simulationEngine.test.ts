import { describe, expect, it } from 'vitest'
import { ASSUMPTIONS } from '../data/assumptions'
import { primaryProfile } from '../data/mockProfiles'
import { deriveMonthlyInstallment, monthlyRateFromEffectiveAnnual } from './financing'
import { resolveGoalTimingInput, simulateScenarios } from './simulationEngine'

describe('FinQuest simulation engine', () => {
  it('is deterministic and returns a complete 10-year timeline', () => {
    const first = simulateScenarios(primaryProfile)
    const second = simulateScenarios(primaryProfile)
    expect(first).toEqual(second)
    expect(first).toHaveLength(3)
    expect(first.every((scenario) => scenario.timeline.length === 10)).toBe(true)
  })

  it('keeps all educational scores and balances finite and bounded', () => {
    const results = simulateScenarios(primaryProfile)
    for (const result of results) {
      expect(Number.isFinite(result.netWorth)).toBe(true)
      expect(Number.isFinite(result.investments)).toBe(true)
      expect(result.healthScore).toBeGreaterThanOrEqual(0)
      expect(result.healthScore).toBeLessThanOrEqual(100)
      expect(result.stressScore).toBeGreaterThanOrEqual(0)
      expect(result.stressScore).toBeLessThanOrEqual(100)
      expect(result.emergencyFundMonths).toBeGreaterThanOrEqual(0)
    }
  })

  it('shows the patient path improving the expensive-finance outcome', () => {
    const results = simulateScenarios(primaryProfile)
    const financed = results.find((item) => item.id === 'finance')!
    const delayed = results.find((item) => item.id === 'delay')!
    expect(delayed.netWorth).toBeGreaterThan(financed.netWorth)
    expect(delayed.investments).toBeGreaterThan(financed.investments)
    expect(delayed.stressScore).toBeLessThan(financed.stressScore)
    expect(delayed.goalDelayMonths).toBeLessThan(financed.goalDelayMonths)
    expect(delayed.goalDelayVsBestMonths).toBe(delayed.goalDelayMonths)
    expect(financed.goalDelayVsBestMonths).toBe(financed.goalDelayMonths)
    expect(delayed.goalReachedMonth).not.toBeNull()
  })

  it('derives the 6.2% effective-rate installment and makes the balloon visible in the average obligation', () => {
    const results = simulateScenarios(primaryProfile)
    const financed = results.find((item) => item.id === 'finance')!
    const expectedInstallment = deriveMonthlyInstallment({
      principal: 150_000,
      balloonPayment: 25_000,
      paymentMonths: 60,
      annualEffectiveRate: 0.062,
    })

    expect(monthlyRateFromEffectiveAnnual(0.062)).toBeCloseTo(0.005, 3)
    expect(financed.monthlyInstallment).toBeCloseTo(expectedInstallment, 10)
    expect(financed.payment).toBeCloseTo(expectedInstallment, 10)
    expect(financed.balloonReserve).toBeCloseTo(25_000 / 60, 10)
    expect(financed.averageMonthlyVehicleObligation).toBeCloseTo(expectedInstallment + 25_000 / 60, 10)
    expect(financed.averageMonthlyObligation).toBeCloseTo(financed.averageMonthlyVehicleObligation, 10)
    expect(financed.totalPayments).toBe(Math.round(10_000 + expectedInstallment * 60 + 25_000))
    expect(results.every((result) => result.timeline.at(-1)?.debt === 0)).toBe(true)
    expect(financed.lifestyleCompression).toBeGreaterThan(0)
  })

  it('uses the car ownership age, not the remaining projection horizon, for depreciation', () => {
    const delayed = simulateScenarios(primaryProfile).find((item) => item.id === 'delay')!

    // Bought in month 13, so it is 108 months old at the end of a 120-month projection.
    expect(delayed.carValue).toBe(23_400)
    expect(delayed.timeline.at(-1)?.carValue).toBe(23_400)
  })

  it('includes existing debt in both monthly capacity and balance-sheet debt', () => {
    const debtFree = simulateScenarios(primaryProfile).find((item) => item.id === 'finance')!
    const existingDebt = simulateScenarios({
      ...primaryProfile,
      currentDebt: 50_000,
      currentMonthlyDebtObligations: 1_000,
    }).find((item) => item.id === 'finance')!

    expect(existingDebt.currentMonthlyDebtObligations).toBe(1_000)
    expect(existingDebt.averageMonthlyObligation).toBeCloseTo(debtFree.averageMonthlyObligation + 1_000, 10)
    expect(existingDebt.timeline[0].debt).toBe(debtFree.timeline[0].debt + 38_000)
    expect(existingDebt.netWorth).toBeLessThan(debtFree.netWorth)
  })

  it('records a nullable goal status while retaining the legacy horizon-capped delay metric', () => {
    const unreachable = simulateScenarios(primaryProfile, { ...ASSUMPTIONS, homeDepositGoal: 1_000_000_000_000 })

    for (const result of unreachable) {
      expect(result.goalReachedMonth).toBeNull()
      expect(result.goalDelayVsBestMonths).toBeNull()
      expect(result.goalDelayMonths).toBe(0)
    }
  })

  it('uses the active profile goal amount for timing, so two personal amounts produce different modeled timing', () => {
    const lowerGoalProfile = { ...primaryProfile, goalAmount: 25_000, goalAmountSource: 'personal' as const }
    const higherGoalProfile = { ...primaryProfile, goalAmount: 100_000, goalAmountSource: 'personal' as const }
    const lowerGoal = simulateScenarios(lowerGoalProfile).find((item) => item.id === 'delay')!
    const higherGoal = simulateScenarios(higherGoalProfile).find((item) => item.id === 'delay')!

    expect(lowerGoal.goalAmount).toBe(25_000)
    expect(lowerGoal.goalAmountSource).toBe('personal')
    expect(higherGoal.goalAmount).toBe(100_000)
    expect(lowerGoal.goalReachedMonth).not.toBeNull()
    expect(higherGoal.goalReachedMonth).not.toBeNull()
    expect(lowerGoal.goalReachedMonth!).toBeLessThan(higherGoal.goalReachedMonth!)
  })

  it('uses the disclosed illustrative default only when a profile omits its optional amount', () => {
    const profileWithNoAmount = { ...primaryProfile, goalAmount: null, goalAmountSource: 'illustrative' as const }
    expect(resolveGoalTimingInput(profileWithNoAmount)).toEqual({ amount: ASSUMPTIONS.homeDepositGoal, source: 'illustrative' })
    expect(resolveGoalTimingInput(primaryProfile, { ...ASSUMPTIONS, homeDepositGoal: 250_000 })).toEqual({ amount: 250_000, source: 'illustrative' })
  })

  it('uses the configured start year and rejects invalid simulation inputs', () => {
    const projected = simulateScenarios(primaryProfile, { ...ASSUMPTIONS, startYear: 2030 })
    expect(projected[0].timeline[0].year).toBe(2031)
    expect(projected[0].timeline.at(-1)?.year).toBe(2040)
    expect(() => simulateScenarios({ ...primaryProfile, monthlyIncome: 0 })).toThrow(RangeError)
    expect(() => simulateScenarios(primaryProfile, { ...ASSUMPTIONS, years: 0 })).toThrow(RangeError)
  })

  it('records rather than forgives a shortfall when assets cannot fund obligations', () => {
    const stressedProfile = {
      ...primaryProfile,
      monthlyIncome: 2_000,
      currentSavings: 0,
      currentInvestments: 0,
    }
    const results = simulateScenarios(stressedProfile)
    expect(results.some((result) => result.unfundedShortfall > 0)).toBe(true)
    expect(results.some((result) => result.unfundedMonths > 0)).toBe(true)
  })

  it('turns the accepted 1,500 SAR quest into a measurable modeled improvement', () => {
    const baseline = simulateScenarios(primaryProfile).find((item) => item.id === 'delay')!
    const afterQuest = simulateScenarios({
      ...primaryProfile,
      currentSavings: primaryProfile.currentSavings + 1_500,
    }).find((item) => item.id === 'delay')!

    expect(afterQuest.netWorth).toBeGreaterThan(baseline.netWorth)
    expect(afterQuest.emergencyFundMonths).toBeGreaterThan(baseline.emergencyFundMonths)
  })
})
