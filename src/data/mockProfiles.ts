import { ILLUSTRATIVE_DEFAULT_GOAL_AMOUNT } from './assumptions'
import type { FinancialProfile } from '../types/finance'

/**
 * Demo profiles carry the one piece of onboarding intent that the original
 * shared FinancialProfile model does not yet represent: the user's goal.
 * They remain structurally assignable to FinancialProfile for existing
 * simulation consumers.
 */
/** Sara is explicitly synthetic, so demo-only age and city may be displayed. */
export interface DemoFinancialProfile extends FinancialProfile {
  age: number
  city: string
}

export const primaryProfile: DemoFinancialProfile = {
  id: 'sara-riyadh-01',
  name: 'سارة الحربي',
  firstName: 'سارة',
  age: 23,
  city: 'الرياض',
  occupation: 'استراتيجية علامة تجارية مبتدئة',
  monthlyIncome: 7_000,
  currentSavings: 8_000,
  currentInvestments: 2_400,
  currentDebt: 0,
  currentMonthlyDebtObligations: 0,
  monthlyInvestment: 200,
  persona: 'Lifestyle Drifter',
  personaNote: 'الدخل يتحرك للأعلى، ومساحة التنفس تحتاج خطوة صغيرة.',
  goal: 'بناء احتياطي طوارئ هادئ',
  goalAmount: ILLUSTRATIVE_DEFAULT_GOAL_AMOUNT,
  goalAmountSource: 'synthetic',
  spending: [
    { key: 'home', label: 'مساهمة السكن', amount: 1_800, color: '#3B82C4', essential: true },
    { key: 'food', label: 'الأكل والمقاهي والتوصيل', amount: 1_600, color: '#58BDE8', essential: true },
    { key: 'transport', label: 'الوقود والتنقل', amount: 700, color: '#1678C8', essential: true },
    { key: 'shopping', label: 'التسوق', amount: 900, color: '#F4B860', essential: false },
    { key: 'lifestyle', label: 'الاشتراكات والترفيه', amount: 500, color: '#7BB7D7', essential: false },
  ],
}

export const optionalProfiles: DemoFinancialProfile[] = [
  primaryProfile,
  {
    ...primaryProfile,
    id: 'faisal-new-hire',
    name: 'Faisal Alotaibi',
    firstName: 'Faisal',
    age: 24,
    occupation: 'Graduate engineer',
    monthlyIncome: 10_500,
    currentSavings: 18_000,
    currentInvestments: 2_000,
    persona: 'High-Income Leaker',
    goal: 'تحويل الدخل القوي إلى ثروة مستمرة',
  },
  {
    ...primaryProfile,
    id: 'layan-student',
    name: 'Layan Alqahtani',
    firstName: 'Layan',
    age: 21,
    occupation: 'University student',
    monthlyIncome: 3_200,
    currentSavings: 9_500,
    currentInvestments: 1_000,
    persona: 'Hidden Saver',
    goal: 'صناعة مساحة لأول هدف كبير',
  },
]
