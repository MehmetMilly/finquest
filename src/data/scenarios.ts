import { deriveMonthlyInstallment } from '../domain/financing'
import { ASSUMPTIONS } from './assumptions'
import type { ScenarioDefinition } from '../types/finance'

const installment = (vehiclePrice: number, downPayment: number, paymentMonths: number, balloonPayment = 0) =>
  deriveMonthlyInstallment({
    principal: vehiclePrice - downPayment,
    balloonPayment,
    paymentMonths,
    annualEffectiveRate: ASSUMPTIONS.illustrativeFinancingRate,
  })

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'finance',
    label: 'Take the 160,000 SAR car',
    shortLabel: 'Finance now',
    futureTitle: 'Debt-Heavy You',
    vehiclePrice: 160_000,
    downPayment: 10_000,
    payment: installment(160_000, 10_000, 60, 25_000),
    paymentStartMonth: 0,
    paymentMonths: 60,
    balloonPayment: 25_000,
    carValueAfterTenYears: 36_000,
    transportCostDelta: 250,
    color: '#C66D58',
    mood: 'compressed',
    benefit: 'New car now, with the least disruption to today.',
  },
  {
    id: 'used',
    label: 'Choose a reliable used car',
    shortLabel: 'Buy used',
    futureTitle: 'Balanced You',
    vehiclePrice: 72_000,
    downPayment: 10_000,
    payment: installment(72_000, 10_000, 48),
    paymentStartMonth: 0,
    paymentMonths: 48,
    carValueAfterTenYears: 18_000,
    transportCostDelta: 50,
    color: '#D8B36A',
    mood: 'steady',
    benefit: 'Mobility now, while preserving more monthly room.',
  },
  {
    id: 'delay',
    label: 'Wait 12 months and build first',
    shortLabel: 'Build, then buy',
    futureTitle: 'Investor You',
    vehiclePrice: 72_000,
    downPayment: 20_000,
    payment: installment(72_000, 20_000, 42),
    paymentStartMonth: 12,
    paymentMonths: 42,
    carValueAfterTenYears: 18_000,
    transportCostDelta: 100,
    prePurchaseMonthlyBoost: 1_200,
    color: '#8FD2AE',
    mood: 'open',
    benefit: 'One patient year buys ten years of more flexibility.',
  },
]
