import type { ScenarioId } from '../types/finance.js'

/** Public model metadata; the API key is never part of this contract. */
export const NARRATIVE_MODEL = 'google/gemini-3.1-flash-lite'
export const NARRATIVE_API_PATH = '/api/explain'
export const MAX_NARRATIVE_CHARACTERS = 520

export type NarrativeFocus = 'monthly_room' | 'emergency_fund' | 'comparison'

/** Compact calculated-only payload shared by the client and server route. */
export interface CompactNarrativeFacts {
  version: 1
  focus: NarrativeFocus
  scenarioId: ScenarioId
  scenario: {
    monthlyFlexibility: number
    averageMonthlyVehicleObligation: number
    emergencyFundMonths: number
    endingEmergencyFundMonths: number
    netWorth: number
    stressScore: number
    goalReachedMonth: number | null
    goalDelayVsBestMonths: number | null
    unfundedShortfall: number
    unfundedMonths: number
  }
  comparison: {
    bestScenarioId: ScenarioId
    bestNetWorth: number
    netWorthDifference: number
  }
}
