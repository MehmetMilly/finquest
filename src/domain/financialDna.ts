import type { FinancialDNA, FinancialProfile } from '../types/finance'
import { ASSUMPTIONS } from '../data/assumptions'
import { clamp } from '../lib/formatters'

export function calculateFinancialDNA(profile: FinancialProfile): FinancialDNA {
  const monthlySpend = profile.spending.reduce((sum, item) => sum + item.amount, 0)
  const monthlySurplus = profile.monthlyIncome - monthlySpend - profile.monthlyInvestment
  const savingsRate = (monthlySurplus + profile.monthlyInvestment) / profile.monthlyIncome
  const emergencyFundMonths = profile.currentSavings / monthlySpend
  const debtPressure = profile.currentMonthlyDebtObligations / Math.max(profile.monthlyIncome, 1)
  const investmentConsistency = profile.monthlyInvestment > 0 ? 0.62 : 0

  const healthScore = Math.round(
    26 * clamp(savingsRate / 0.2) +
      27 * clamp(emergencyFundMonths / ASSUMPTIONS.emergencyFundTargetMonths) +
      22 * (1 - clamp(debtPressure / ASSUMPTIONS.safeDebtToIncome)) +
      15 * investmentConsistency +
      10 * clamp(monthlySurplus / (profile.monthlyIncome * 0.15)),
  )

  return {
    monthlySpend,
    monthlySurplus,
    savingsRate,
    emergencyFundMonths,
    debtPressure,
    investmentConsistency,
    healthScore: Math.min(100, healthScore),
  }
}
