import { ASSUMPTIONS } from '../data/assumptions'
import { SCENARIOS } from '../data/scenarios'
import type {
  FinancialProfile,
  ScenarioDefinition,
  ScenarioId,
  ScenarioResult,
  SimulationAssumptions,
} from '../types/finance'
import { simulateScenarios } from './simulationEngine'

export type SensitivityPresetId = 'higher_inflation' | 'slower_income_growth' | 'lower_investment_return'

export interface SensitivityChange {
  key: 'annualInflation' | 'annualSalaryGrowth' | 'annualInvestmentReturn'
  label: string
  baselineValue: number
  changedValue: number
}

export interface SensitivityPreset {
  id: SensitivityPresetId
  label: string
  description: string
  changes: readonly SensitivityChange[]
  assumptions: SimulationAssumptions
}

export interface SensitivityScenarioComparison {
  scenarioId: ScenarioId
  baseline: ScenarioResult
  variant: ScenarioResult
  netWorthDelta: number
  monthlyFlexibilityDelta: number
  emergencyFundMonthsDelta: number
  /** Null means at least one of the two modeled paths does not reach the goal. */
  goalReachedMonthDelta: number | null
}

export interface SensitivityAnalysis {
  preset: SensitivityPreset
  results: ScenarioResult[]
  selected: SensitivityScenarioComparison
}

export interface SensitivityAnalysisSet {
  baselineResults: ScenarioResult[]
  analyses: SensitivityAnalysis[]
}

function adjustPercentagePoint(value: number, change: number) {
  // The simulation accepts negative annual rates above -100%; keep presets valid
  // if a caller provides custom, unusually low starting assumptions.
  return Math.max(-0.99, value + change)
}

/**
 * Produces 3 transparent what-if inputs. They alter only the assumptions passed
 * to the existing simulation engine; no sensitivity number is hand-authored.
 */
export function createSensitivityPresets(base: SimulationAssumptions): SensitivityPreset[] {
  const higherInflation = adjustPercentagePoint(base.annualInflation, 0.01)
  const slowerIncomeGrowth = adjustPercentagePoint(base.annualSalaryGrowth, -0.02)
  const lowerInvestmentReturn = adjustPercentagePoint(base.annualInvestmentReturn, -0.02)

  return [
    {
      id: 'higher_inflation',
      label: 'تضخم أعلى',
      description: 'اختبار يرفع افتراض التضخم السنوي في النموذج فقط.',
      changes: [{ key: 'annualInflation', label: 'التضخم السنوي', baselineValue: base.annualInflation, changedValue: higherInflation }],
      assumptions: { ...base, annualInflation: higherInflation },
    },
    {
      id: 'slower_income_growth',
      label: 'نمو دخل أبطأ',
      description: 'اختبار يخفض افتراض نمو الدخل السنوي في النموذج فقط.',
      changes: [{ key: 'annualSalaryGrowth', label: 'نمو الدخل السنوي', baselineValue: base.annualSalaryGrowth, changedValue: slowerIncomeGrowth }],
      assumptions: { ...base, annualSalaryGrowth: slowerIncomeGrowth },
    },
    {
      id: 'lower_investment_return',
      label: 'عائد استثمار أقل',
      description: 'اختبار يخفض افتراض عائد الاستثمار السنوي في النموذج فقط.',
      changes: [{ key: 'annualInvestmentReturn', label: 'عائد الاستثمار السنوي', baselineValue: base.annualInvestmentReturn, changedValue: lowerInvestmentReturn }],
      assumptions: { ...base, annualInvestmentReturn: lowerInvestmentReturn },
    },
  ]
}

function selectedScenario(results: ScenarioResult[], scenarioId?: ScenarioId) {
  const selected = results.find((scenario) => scenario.id === scenarioId) ?? results[0]
  if (!selected) throw new RangeError('Sensitivity analysis requires at least one scenario.')
  return selected
}

function compareScenarioResults(baseline: ScenarioResult, variant: ScenarioResult): SensitivityScenarioComparison {
  const goalReachedMonthDelta =
    baseline.goalReachedMonth === null || variant.goalReachedMonth === null
      ? null
      : variant.goalReachedMonth - baseline.goalReachedMonth

  return {
    scenarioId: baseline.id,
    baseline,
    variant,
    netWorthDelta: variant.netWorth - baseline.netWorth,
    monthlyFlexibilityDelta: variant.monthlyFlexibility - baseline.monthlyFlexibility,
    emergencyFundMonthsDelta: variant.emergencyFundMonths - baseline.emergencyFundMonths,
    goalReachedMonthDelta,
  }
}

/**
 * Reuses the exact profile, custom car scenarios, and engine used by the main
 * decision flow. Outputs describe a changed model input, not a prediction.
 */
export function buildSensitivityAnalyses(
  profile: FinancialProfile,
  assumptions: SimulationAssumptions = ASSUMPTIONS,
  scenarios: ScenarioDefinition[] = SCENARIOS,
  activeScenarioId?: ScenarioId,
): SensitivityAnalysisSet {
  const baselineResults = simulateScenarios(profile, assumptions, scenarios)
  const baselineSelected = selectedScenario(baselineResults, activeScenarioId)
  const analyses = createSensitivityPresets(assumptions).map((preset) => {
    const results = simulateScenarios(profile, preset.assumptions, scenarios)
    const variantSelected = selectedScenario(results, baselineSelected.id)
    return {
      preset,
      results,
      selected: compareScenarioResults(baselineSelected, variantSelected),
    }
  })

  return { baselineResults, analyses }
}
