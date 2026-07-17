import { ASSUMPTIONS } from '../data/assumptions'
import { SCENARIOS } from '../data/scenarios'
import { clamp } from '../lib/formatters'
import type {
  FinancialProfile,
  GoalAmountSource,
  ScenarioDefinition,
  ScenarioResult,
  SimulationAssumptions,
  SpendingCategory,
  YearPoint,
} from '../types/finance'
import { deriveMonthlyInstallment, monthlyRateFromEffectiveAnnual } from './financing'

const DEPRECIATION_MONTHS = 10 * 12

function assertFinite(value: unknown, label: string, minimum = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    throw new RangeError(`${label} must be a finite number greater than or equal to ${minimum}.`)
  }
}

function assertPositiveInteger(value: unknown, label: string) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer.`)
  }
}

function isEssentialSpend(category: SpendingCategory): boolean {
  if (typeof category.essential === 'boolean') return category.essential
  return category.key === 'home' || category.key === 'food' || category.key === 'transport' || category.key === 'family'
}

function validateProfile(profile: FinancialProfile) {
  if (!profile || typeof profile !== 'object') {
    throw new TypeError('profile must be an object.')
  }
  assertFinite(profile.monthlyIncome, 'profile.monthlyIncome', Number.EPSILON)
  assertFinite(profile.currentSavings, 'profile.currentSavings')
  assertFinite(profile.currentInvestments, 'profile.currentInvestments')
  assertFinite(profile.currentDebt, 'profile.currentDebt')
  assertFinite(profile.currentMonthlyDebtObligations, 'profile.currentMonthlyDebtObligations')
  assertFinite(profile.monthlyInvestment, 'profile.monthlyInvestment')
  if (profile.goalAmount !== null) assertFinite(profile.goalAmount, 'profile.goalAmount', Number.EPSILON)

  if (!Array.isArray(profile.spending)) {
    throw new TypeError('profile.spending must be an array.')
  }
  profile.spending.forEach((category, index) => {
    if (!category || typeof category !== 'object') {
      throw new TypeError(`profile.spending[${index}] must be an object.`)
    }
    assertFinite(category.amount, `profile.spending[${index}].amount`)
  })
}

function validateAssumptions(assumptions: SimulationAssumptions) {
  if (!assumptions || typeof assumptions !== 'object') {
    throw new TypeError('assumptions must be an object.')
  }
  assertPositiveInteger(assumptions.startYear, 'assumptions.startYear')
  assertPositiveInteger(assumptions.years, 'assumptions.years')
  assertFinite(assumptions.annualSalaryGrowth, 'assumptions.annualSalaryGrowth', -0.999_999)
  assertFinite(assumptions.annualInflation, 'assumptions.annualInflation', -0.999_999)
  assertFinite(assumptions.annualInvestmentReturn, 'assumptions.annualInvestmentReturn', -0.999_999)
  assertFinite(assumptions.annualSavingsReturn, 'assumptions.annualSavingsReturn', -0.999_999)
  assertFinite(assumptions.illustrativeFinancingRate, 'assumptions.illustrativeFinancingRate')
  assertFinite(assumptions.emergencyFundTargetMonths, 'assumptions.emergencyFundTargetMonths', Number.EPSILON)
  assertFinite(assumptions.safeDebtToIncome, 'assumptions.safeDebtToIncome', Number.EPSILON)
  assertFinite(assumptions.homeDepositGoal, 'assumptions.homeDepositGoal')
  assertPositiveInteger(assumptions.existingDebtApproximationMonths, 'assumptions.existingDebtApproximationMonths')
}

/**
 * Profiles own an entered target. The shared assumption is only the disclosed
 * illustrative fallback; a caller that deliberately changes that target gets
 * an explicit engine override for controlled what-if tests.
 */
export function resolveGoalTimingInput(
  profile: FinancialProfile,
  assumptions: SimulationAssumptions = ASSUMPTIONS,
): { amount: number; source: GoalAmountSource } {
  const explicitAssumptionTarget = assumptions.homeDepositGoal !== ASSUMPTIONS.homeDepositGoal
  if (explicitAssumptionTarget || profile.goalAmount === null) {
    return { amount: assumptions.homeDepositGoal, source: 'illustrative' }
  }
  return { amount: profile.goalAmount, source: profile.goalAmountSource }
}

function validateScenario(scenario: ScenarioDefinition, projectionMonths: number) {
  assertFinite(scenario.vehiclePrice, `${scenario.id}.vehiclePrice`, Number.EPSILON)
  assertFinite(scenario.downPayment, `${scenario.id}.downPayment`)
  assertFinite(scenario.payment, `${scenario.id}.payment`)
  assertFinite(scenario.balloonPayment ?? 0, `${scenario.id}.balloonPayment`)
  assertPositiveInteger(scenario.paymentMonths, `${scenario.id}.paymentMonths`)
  if (!Number.isInteger(scenario.paymentStartMonth) || scenario.paymentStartMonth < 0 || scenario.paymentStartMonth >= projectionMonths) {
    throw new RangeError(`${scenario.id}.paymentStartMonth must be a non-negative integer inside the projection horizon.`)
  }
  if (scenario.downPayment > scenario.vehiclePrice) {
    throw new RangeError(`${scenario.id}.downPayment cannot exceed the vehicle price.`)
  }
  const financedPrincipal = scenario.vehiclePrice - scenario.downPayment
  if (financedPrincipal <= 0) {
    throw new RangeError(`${scenario.id} must have a positive financed principal.`)
  }
  if ((scenario.balloonPayment ?? 0) > financedPrincipal) {
    throw new RangeError(`${scenario.id}.balloonPayment cannot exceed the financed principal.`)
  }
  assertFinite(scenario.carValueAfterTenYears, `${scenario.id}.carValueAfterTenYears`)
  assertFinite(scenario.transportCostDelta, `${scenario.id}.transportCostDelta`, -scenario.vehiclePrice)
  assertFinite(scenario.prePurchaseMonthlyBoost ?? 0, `${scenario.id}.prePurchaseMonthlyBoost`)
}

function createNarrative(
  scenario: ScenarioDefinition,
  result: Omit<ScenarioResult, 'quote' | 'summary' | 'opportunityCost'>,
) {
  if (scenario.id === 'finance') {
    return {
      quote: `“I loved the car. I didn’t love how often ${Math.abs(Math.round(result.monthlyFlexibility)).toLocaleString()} SAR was already spoken for.”`,
      summary: `The ${Math.round(result.monthlyInstallment).toLocaleString()} SAR installment is only part of the obligation; reserving for the final payment lifts it to ${Math.round(result.averageMonthlyVehicleObligation).toLocaleString()} SAR per month for five years.`,
    }
  }
  if (scenario.id === 'used') {
    return {
      quote: '“The badge got smaller. Our breathing room came back sooner.”',
      summary: 'A practical car keeps the immediate mobility benefit while shortening the period of pressure.',
    }
  }
  return {
    quote: '“We waited one year. That pause made the next nine feel lighter.”',
    summary: 'Building the deposit first protects liquidity and leaves more money available to compound.',
  }
}

function simulateOne(
  profile: FinancialProfile,
  scenario: ScenarioDefinition,
  assumptions: SimulationAssumptions,
) {
  const projectionMonths = assumptions.years * 12
  const goalTiming = resolveGoalTimingInput(profile, assumptions)
  const baseSpend = profile.spending.reduce((sum, category) => sum + category.amount, 0)
  const essentialBaseSpend = profile.spending.reduce(
    (sum, category) => sum + (isEssentialSpend(category) ? category.amount : 0),
    0,
  )
  const compressibleBase = profile.spending.reduce((sum, category) => {
    if (!isEssentialSpend(category)) return sum + category.amount
    // Food is essential, but delivery and café spending make part of it temporarily adjustable.
    return category.key === 'food' ? sum + category.amount * 0.5 : sum
  }, 0)
  const principal = scenario.vehiclePrice - scenario.downPayment
  const monthlyInstallment = deriveMonthlyInstallment({
    principal,
    balloonPayment: scenario.balloonPayment,
    paymentMonths: scenario.paymentMonths,
    annualEffectiveRate: assumptions.illustrativeFinancingRate,
  })
  const financingMonthlyRate = monthlyRateFromEffectiveAnnual(assumptions.illustrativeFinancingRate)
  const balloonReserve = (scenario.balloonPayment ?? 0) / scenario.paymentMonths
  const averageMonthlyVehicleObligation = monthlyInstallment + balloonReserve
  const currentMonthlyDebtObligations = profile.currentMonthlyDebtObligations
  const averageMonthlyObligation = averageMonthlyVehicleObligation + currentMonthlyDebtObligations

  let savings = profile.currentSavings
  let investments = profile.currentInvestments
  let totalPayments = 0
  let fundedInvestmentMonths = 0
  let carValue = 0
  let vehicleDebt = 0
  let currentDebt = profile.currentDebt
  let balloonFund = 0
  let unfundedShortfall = 0
  let unfundedMonths = 0
  let totalLifestyleCompression = 0
  let minimumEmergencyMonths = Number.POSITIVE_INFINITY
  let goalReachedMonth: number | null =
    savings + investments - unfundedShortfall >= goalTiming.amount ? 0 : null
  let lastRequiredMonthlyOutgoings = Math.max(essentialBaseSpend, 1)
  const timeline: YearPoint[] = []
  const flexSamples: number[] = []
  const stressSamples: number[] = []
  const savingsRateMonthly = monthlyRateFromEffectiveAnnual(assumptions.annualSavingsReturn)
  const investmentRateMonthly = monthlyRateFromEffectiveAnnual(assumptions.annualInvestmentReturn)

  for (let month = 0; month < projectionMonths; month += 1) {
    const yearIndex = Math.floor(month / 12)
    const salary = profile.monthlyIncome * Math.pow(1 + assumptions.annualSalaryGrowth, yearIndex)
    const inflationFactor = Math.pow(1 + assumptions.annualInflation, yearIndex)
    let expenses = baseSpend * inflationFactor
    let essentialExpenses = essentialBaseSpend * inflationFactor
    const purchased = month >= scenario.paymentStartMonth
    const paymentActive = purchased && month < scenario.paymentStartMonth + scenario.paymentMonths

    if (purchased) {
      expenses += scenario.transportCostDelta
      essentialExpenses += Math.max(scenario.transportCostDelta, 0)
    }
    const scheduledPayment = paymentActive ? monthlyInstallment : 0
    const reserve = paymentActive ? balloonReserve : 0
    const currentDebtPayment = currentDebt > 0 ? Math.min(currentMonthlyDebtObligations, currentDebt) : 0

    if (month === scenario.paymentStartMonth) {
      savings -= scenario.downPayment
      if (savings < 0) {
        unfundedShortfall += Math.abs(savings)
        unfundedMonths += 1
        savings = 0
      }
      totalPayments += scenario.downPayment
      vehicleDebt = principal
      carValue = scenario.vehiclePrice
    }

    if (paymentActive) {
      totalPayments += scheduledPayment
      const interest = vehicleDebt * financingMonthlyRate
      const scheduledPrincipal = Math.max(0, scheduledPayment - interest)
      vehicleDebt = Math.max(0, vehicleDebt - scheduledPrincipal)
      balloonFund += reserve

      if (month === scenario.paymentStartMonth + scenario.paymentMonths - 1) {
        const balloonPayment = scenario.balloonPayment ?? 0
        totalPayments += balloonPayment
        balloonFund = Math.max(0, balloonFund - balloonPayment)
        vehicleDebt = Math.max(0, vehicleDebt - balloonPayment)
        // Remove harmless floating-point residue once the contractual final payment has been made.
        if (vehicleDebt < 0.01) vehicleDebt = 0
      }
    }

    if (currentDebtPayment > 0) {
      // Existing debt has no rate or term input, so its supplied obligation is treated as principal repayment.
      currentDebt = Math.max(0, currentDebt - currentDebtPayment)
    }

    if (purchased) {
      const ownedMonths = month - scenario.paymentStartMonth + 1
      const ownershipProgress = clamp(ownedMonths / DEPRECIATION_MONTHS)
      carValue = scenario.vehiclePrice + (scenario.carValueAfterTenYears - scenario.vehiclePrice) * ownershipProgress
    }

    const delayBuild = !purchased ? scenario.prePurchaseMonthlyBoost ?? 0 : 0
    const rawFlexibility = salary - expenses - scheduledPayment - reserve - currentDebtPayment - profile.monthlyInvestment - delayBuild
    flexSamples.push(rawFlexibility)

    savings *= 1 + savingsRateMonthly
    investments *= 1 + investmentRateMonthly

    const availableAfterObligations = salary - expenses - scheduledPayment - reserve - currentDebtPayment
    if (availableAfterObligations >= 0) {
      let contributionBudget = availableAfterObligations
      const actualBuild = Math.min(delayBuild, contributionBudget)
      savings += actualBuild
      contributionBudget -= actualBuild
      const actualInvestment = Math.min(profile.monthlyInvestment, contributionBudget)
      investments += actualInvestment
      contributionBudget -= actualInvestment
      if (actualInvestment > 0) fundedInvestmentMonths += 1

      const emergencyTarget = Math.max(essentialExpenses + scheduledPayment + reserve + currentDebtPayment, 1) * assumptions.emergencyFundTargetMonths
      const cashShare = savings < emergencyTarget ? 0.65 : 0.18
      savings += contributionBudget * cashShare
      investments += contributionBudget * (1 - cashShare)
    } else {
      const maximumCompression = compressibleBase * inflationFactor * 0.55
      const lifestyleCompression = Math.min(Math.abs(availableAfterObligations), maximumCompression)
      totalLifestyleCompression += lifestyleCompression
      const deficit = Math.abs(availableAfterObligations) - lifestyleCompression
      if (savings >= deficit) savings -= deficit
      else {
        const remainder = deficit - Math.max(savings, 0)
        savings = 0
        const investmentDraw = Math.min(investments, remainder)
        investments -= investmentDraw
        const stillUnfunded = remainder - investmentDraw
        if (stillUnfunded > 0) {
          unfundedShortfall += stillUnfunded
          unfundedMonths += 1
        }
      }
    }

    lastRequiredMonthlyOutgoings = Math.max(essentialExpenses + scheduledPayment + reserve + currentDebtPayment, 1)
    const emergencyMonths = savings / lastRequiredMonthlyOutgoings
    minimumEmergencyMonths = Math.min(minimumEmergencyMonths, emergencyMonths)
    const debtRatio = (scheduledPayment + reserve + currentDebtPayment) / Math.max(salary, 1)
    const flexibilityPressure = clamp(-rawFlexibility / (salary * 0.2))
    const liquidityPressure = 1 - clamp(emergencyMonths / assumptions.emergencyFundTargetMonths)
    const debtPressure = clamp(debtRatio / assumptions.safeDebtToIncome)
    const stress = Math.round(100 * (0.36 * debtPressure + 0.34 * liquidityPressure + 0.3 * flexibilityPressure))
    stressSamples.push(stress)

    if (goalReachedMonth === null && savings + investments - unfundedShortfall >= goalTiming.amount) {
      goalReachedMonth = month + 1
    }

    if ((month + 1) % 12 === 0) {
      const debt = vehicleDebt + currentDebt
      timeline.push({
        year: assumptions.startYear + (month + 1) / 12,
        netWorth: Math.round(savings + investments + balloonFund + carValue - debt - unfundedShortfall),
        savings: Math.round(savings),
        investments: Math.round(investments),
        debt: Math.round(debt),
        carValue: Math.round(carValue),
        shortfall: Math.round(unfundedShortfall),
      })
    }
  }

  const end = timeline.at(-1)!
  const monthlyFlexibility = flexSamples.slice(0, 12).reduce((a, b) => a + b, 0) / 12
  const endEmergencyFundMonths = savings / lastRequiredMonthlyOutgoings
  const emergencyFundMonths = Number.isFinite(minimumEmergencyMonths) ? minimumEmergencyMonths : 0
  const debtPressure = averageMonthlyObligation / profile.monthlyIncome
  const stressWindow = stressSamples.slice(0, Math.min(60, stressSamples.length))
  const stressScore = Math.round(
    0.65 * (stressWindow.reduce((a, b) => a + b, 0) / stressWindow.length) + 0.35 * Math.max(...stressWindow),
  )
  const investmentConsistency = fundedInvestmentMonths / projectionMonths
  const healthScore = Math.round(
    30 * clamp(monthlyFlexibility / (profile.monthlyIncome * 0.15) + 0.5) +
      25 * clamp(endEmergencyFundMonths / assumptions.emergencyFundTargetMonths) +
      20 * (1 - clamp(debtPressure / assumptions.safeDebtToIncome)) +
      15 * investmentConsistency +
      10 * clamp((savings + investments) / goalTiming.amount),
  )

  const partial = {
    ...scenario,
    payment: monthlyInstallment,
    netWorth: end.netWorth,
    savings: Math.round(savings),
    investments: Math.round(investments),
    carValue: Math.round(carValue),
    totalPayments: Math.round(totalPayments),
    monthlyFlexibility: Math.round(monthlyFlexibility),
    monthlyInstallment,
    balloonReserve,
    averageMonthlyVehicleObligation,
    averageMonthlyObligation,
    financingAnnualRate: assumptions.illustrativeFinancingRate,
    currentMonthlyDebtObligations,
    emergencyFundMonths,
    endingEmergencyFundMonths: endEmergencyFundMonths,
    debtPressure,
    goalAmount: goalTiming.amount,
    goalAmountSource: goalTiming.source,
    goalReachedMonth,
    goalDelayVsBestMonths: null,
    goalDelayMonths: goalReachedMonth ?? projectionMonths,
    healthScore: Math.round(clamp(healthScore / 100) * 100),
    stressScore: Math.round(clamp(stressScore / 100) * 100),
    investmentConsistency,
    lifestyleCompression: Math.round(totalLifestyleCompression / Math.min(60, projectionMonths)),
    unfundedShortfall: Math.round(unfundedShortfall),
    unfundedMonths,
    timeline,
  }

  return { ...partial, ...createNarrative(scenario, partial) }
}

export function simulateScenarios(
  profile: FinancialProfile,
  assumptions: SimulationAssumptions = ASSUMPTIONS,
  scenarios: ScenarioDefinition[] = SCENARIOS,
): ScenarioResult[] {
  validateProfile(profile)
  validateAssumptions(assumptions)
  const projectionMonths = assumptions.years * 12
  scenarios.forEach((scenario) => validateScenario(scenario, projectionMonths))

  const raw = scenarios.map((scenario) => simulateOne(profile, scenario, assumptions))
  const bestNetWorth = Math.max(...raw.map((scenario) => scenario.netWorth))
  const reachedGoalMonths = raw.flatMap((scenario) =>
    scenario.goalReachedMonth === null ? [] : [scenario.goalReachedMonth],
  )
  const earliestGoalMonth = reachedGoalMonths.length > 0 ? Math.min(...reachedGoalMonths) : null

  return raw.map((scenario) => {
    const goalDelayVsBestMonths =
      scenario.goalReachedMonth !== null && earliestGoalMonth !== null
        ? scenario.goalReachedMonth - earliestGoalMonth
        : null
    // Keep the legacy number usable by existing UI. If a path does not reach the goal,
    // it remains horizon-capped; new consumers should use goalReachedMonth for that distinction.
    const goalDelayMonths =
      goalDelayVsBestMonths ?? (earliestGoalMonth === null ? 0 : Math.max(0, projectionMonths - earliestGoalMonth))

    return {
      ...scenario,
      opportunityCost: bestNetWorth - scenario.netWorth,
      goalDelayVsBestMonths,
      goalDelayMonths,
    }
  })
}
