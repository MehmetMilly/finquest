import type { SimulationAssumptions } from '../types/finance'

/** Used only when a person leaves the optional goal amount blank. */
export const ILLUSTRATIVE_DEFAULT_GOAL_AMOUNT = 100_000

/**
 * A compact, reusable disclosure source for onboarding and any assumption
 * surface. These are model inputs, not personal facts or forecasts.
 */
export const MODEL_DISCLOSURES = {
  optionalGoalAmount: {
    title: 'مبلغ الهدف اختياري',
    detail: `إذا تركته فارغًا، يحسب النموذج توقيت الهدف على مبلغ توضيحي قدره ${ILLUSTRATIVE_DEFAULT_GOAL_AMOUNT.toLocaleString('en-SA')} ر.س، وليس مبلغًا منسوبًا إليك.`,
  },
  existingDebt: {
    title: 'تقريب الالتزامات الحالية',
    detail: 'نطلب القسط الشهري فقط؛ ولغرض التعليم يعامل النموذج هذا القسط كالتزام لمدة ١٢ شهرًا، لا كرصيد أو مدة قرض حقيقية.',
  },
} as const

export const ASSUMPTIONS: SimulationAssumptions = {
  startYear: 2026,
  years: 10,
  annualSalaryGrowth: 0.035,
  annualInflation: 0.025,
  annualInvestmentReturn: 0.065,
  annualSavingsReturn: 0.02,
  illustrativeFinancingRate: 0.062,
  emergencyFundTargetMonths: 6,
  safeDebtToIncome: 0.33,
  homeDepositGoal: ILLUSTRATIVE_DEFAULT_GOAL_AMOUNT,
  existingDebtApproximationMonths: 12,
}
