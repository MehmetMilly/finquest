export type CategoryKey =
  | 'home'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'lifestyle'
  | 'family'

export interface SpendingCategory {
  key: CategoryKey
  label: string
  amount: number
  color: string
  /** Whether the category is needed to maintain the household's basic baseline. */
  essential?: boolean
}

export interface FinancialProfile {
  id: string
  name: string
  firstName: string
  /**
   * Synthetic demo attributes only. Personal onboarding deliberately does not
   * collect these, so consumers must gracefully handle their absence.
   */
  age?: number
  city?: string
  occupation: string
  monthlyIncome: number
  currentSavings: number
  currentInvestments: number
  currentDebt: number
  /** Required monthly payments for debt that already exists at the start of the simulation. */
  currentMonthlyDebtObligations: number
  monthlyInvestment: number
  spending: SpendingCategory[]
  persona: string
  personaNote: string
  /** User-facing label for the financial target being timed by the model. */
  goal: string
  /**
   * A personally entered target when supplied. `null` means the simulation
   * uses its clearly disclosed illustrative fallback instead.
   */
  goalAmount: number | null
  goalAmountSource: GoalAmountSource
}

export type GoalAmountSource = 'personal' | 'illustrative' | 'synthetic'

export interface SimulationAssumptions {
  startYear: number
  years: number
  annualSalaryGrowth: number
  annualInflation: number
  annualInvestmentReturn: number
  annualSavingsReturn: number
  illustrativeFinancingRate: number
  emergencyFundTargetMonths: number
  safeDebtToIncome: number
  /**
   * Default target only when a profile omits its goal amount; it is not an
   * inferred personal objective.
   */
  homeDepositGoal: number
  /**
   * Personal onboarding turns an entered monthly existing-debt obligation
   * into a 12-month illustrative opening balance because no balance or term
   * is collected.
   */
  existingDebtApproximationMonths: number
}

export type ScenarioId = 'finance' | 'used' | 'delay'

export interface ScenarioDefinition {
  id: ScenarioId
  label: string
  shortLabel: string
  futureTitle: string
  vehiclePrice: number
  downPayment: number
  payment: number
  paymentStartMonth: number
  paymentMonths: number
  balloonPayment?: number
  carValueAfterTenYears: number
  transportCostDelta: number
  prePurchaseMonthlyBoost?: number
  color: string
  mood: 'compressed' | 'steady' | 'open'
  benefit: string
}

export interface YearPoint {
  year: number
  netWorth: number
  savings: number
  investments: number
  debt: number
  carValue: number
  shortfall: number
}

export interface ScenarioResult extends ScenarioDefinition {
  netWorth: number
  savings: number
  investments: number
  carValue: number
  totalPayments: number
  monthlyFlexibility: number
  /** Calculated level installment, excluding the balloon reserve. Mirrors `payment` for result consumers. */
  monthlyInstallment: number
  /** Monthly amount set aside so the contractual balloon is fully funded by the final payment. */
  balloonReserve: number
  /** Vehicle installment plus balloon reserve, averaged across the financing term. */
  averageMonthlyVehicleObligation: number
  /** Existing debt service plus the vehicle's average monthly obligation. */
  averageMonthlyObligation: number
  financingAnnualRate: number
  currentMonthlyDebtObligations: number
  emergencyFundMonths: number
  endingEmergencyFundMonths: number
  debtPressure: number
  /** Target actually used for the goal-timing calculation in this result. */
  goalAmount: number
  goalAmountSource: GoalAmountSource
  /** Month from simulation start when liquid assets first meet the goal; null when it is not reached in the horizon. */
  goalReachedMonth: number | null
  /** Comparable delay only when this scenario reaches the goal inside the projection horizon. */
  goalDelayVsBestMonths: number | null
  /** Legacy, horizon-capped delay value retained for existing UI consumers. */
  goalDelayMonths: number
  healthScore: number
  stressScore: number
  investmentConsistency: number
  lifestyleCompression: number
  unfundedShortfall: number
  unfundedMonths: number
  opportunityCost: number
  timeline: YearPoint[]
  quote: string
  summary: string
}

export interface FinancialDNA {
  monthlySpend: number
  monthlySurplus: number
  savingsRate: number
  emergencyFundMonths: number
  debtPressure: number
  investmentConsistency: number
  healthScore: number
}
