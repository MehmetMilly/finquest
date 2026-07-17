import { ASSUMPTIONS } from '../data/assumptions'
import type { CategoryKey, FinancialProfile, GoalAmountSource, SpendingCategory } from '../types/finance'

export type ProfileSource = 'personal' | 'sara'
export type ActiveFinancialProfile = FinancialProfile

export interface ProfileDraft {
  displayName: string
  monthlyIncome: number
  essentialSpending: number
  flexibleSpending: number
  currentSavings: number
  existingMonthlyDebtObligations: number
  monthlyInvestment: number
  goal: string
  /** Null deliberately means “use the disclosed illustrative model default.” */
  goalAmount: number | null
}

export type ActiveProfileInput = FinancialProfile | ProfileDraft
export type ProfileDraftField = keyof ProfileDraft | 'budget'

export interface ProfileValidationErrors {
  displayName?: string
  monthlyIncome?: string
  essentialSpending?: string
  flexibleSpending?: string
  currentSavings?: string
  existingMonthlyDebtObligations?: string
  monthlyInvestment?: string
  goal?: string
  goalAmount?: string
  budget?: string
}

export interface ProfileValidationResult {
  valid: boolean
  errors: ProfileValidationErrors
}

/** Deliberately modest limits for a Saudi young-adult educational model. */
export const PROFILE_LIMITS = {
  displayName: { minLength: 2, maxLength: 60 },
  monthlyIncome: { min: 1_000, max: 1_000_000 },
  essentialSpending: { min: 0, max: 1_000_000 },
  flexibleSpending: { min: 0, max: 1_000_000 },
  currentSavings: { min: 0, max: 10_000_000 },
  existingMonthlyDebtObligations: { min: 0, max: 1_000_000 },
  monthlyInvestment: { min: 0, max: 1_000_000 },
  goal: { minLength: 3, maxLength: 120 },
  goalAmount: { min: 1, max: 10_000_000 },
} as const

/** Numeric defaults make the compact form useful without claiming user data. */
export const DEFAULT_PROFILE_DRAFT: ProfileDraft = {
  displayName: '',
  monthlyIncome: 7_000,
  essentialSpending: 4_100,
  flexibleSpending: 1_400,
  currentSavings: 8_000,
  existingMonthlyDebtObligations: 0,
  monthlyInvestment: 0,
  goal: 'بناء احتياطي طوارئ',
  goalAmount: null,
}

export const FALLBACK_PROFILE_DRAFT: ProfileDraft = {
  ...DEFAULT_PROFILE_DRAFT,
  displayName: 'مستخدم FinQuest',
}

const CATEGORY_KEYS: readonly CategoryKey[] = ['home', 'food', 'transport', 'shopping', 'lifestyle', 'family']
const profileSources: readonly ProfileSource[] = ['personal', 'sara']
const goalAmountSources: readonly GoalAmountSource[] = ['personal', 'illustrative', 'synthetic']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isInList<T extends string>(value: unknown, list: readonly T[]): value is T {
  return typeof value === 'string' && list.includes(value as T)
}

function isFiniteNonNegative(value: unknown, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
}

function isFiniteGoalAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= PROFILE_LIMITS.goalAmount.min && value <= PROFILE_LIMITS.goalAmount.max
}

function isSpendingCategory(value: unknown): value is SpendingCategory {
  if (!isRecord(value)) return false
  return (
    isInList(value.key, CATEGORY_KEYS) &&
    typeof value.label === 'string' && value.label.trim().length > 0 &&
    isFiniteNonNegative(value.amount, PROFILE_LIMITS.essentialSpending.max) &&
    typeof value.color === 'string' &&
    (value.essential === undefined || typeof value.essential === 'boolean')
  )
}

export function isProfileSource(value: unknown): value is ProfileSource {
  return isInList(value, profileSources)
}

export function isGoalAmountSource(value: unknown): value is GoalAmountSource {
  return isInList(value, goalAmountSources)
}

/** Runtime guard for data read from localStorage or an integration boundary. */
export function isActiveFinancialProfile(value: unknown): value is ActiveFinancialProfile {
  if (!isRecord(value)) return false
  const goalAmountIsValid = value.goalAmount === null || isFiniteGoalAmount(value.goalAmount)
  const goalSourceIsValid = isGoalAmountSource(value.goalAmountSource)
  const goalShapeIsValid =
    goalAmountIsValid &&
    goalSourceIsValid &&
    (value.goalAmount === null ? value.goalAmountSource === 'illustrative' : value.goalAmountSource !== 'illustrative')

  return (
    typeof value.id === 'string' && value.id.trim().length > 0 && value.id.length <= 120 &&
    typeof value.name === 'string' && value.name.trim().length >= PROFILE_LIMITS.displayName.minLength && value.name.length <= PROFILE_LIMITS.displayName.maxLength &&
    typeof value.firstName === 'string' && value.firstName.trim().length > 0 &&
    (value.age === undefined || isFiniteNonNegative(value.age, 120)) &&
    (value.city === undefined || (typeof value.city === 'string' && value.city.trim().length > 0)) &&
    typeof value.occupation === 'string' && value.occupation.trim().length > 0 &&
    isFiniteNonNegative(value.monthlyIncome, PROFILE_LIMITS.monthlyIncome.max) && value.monthlyIncome >= PROFILE_LIMITS.monthlyIncome.min &&
    isFiniteNonNegative(value.currentSavings, PROFILE_LIMITS.currentSavings.max) &&
    isFiniteNonNegative(value.currentInvestments, PROFILE_LIMITS.currentSavings.max) &&
    isFiniteNonNegative(value.currentDebt, PROFILE_LIMITS.existingMonthlyDebtObligations.max * ASSUMPTIONS.existingDebtApproximationMonths) &&
    isFiniteNonNegative(value.currentMonthlyDebtObligations, PROFILE_LIMITS.existingMonthlyDebtObligations.max) &&
    isFiniteNonNegative(value.monthlyInvestment, PROFILE_LIMITS.monthlyInvestment.max) &&
    Array.isArray(value.spending) && value.spending.length > 0 && value.spending.length <= CATEGORY_KEYS.length && value.spending.every(isSpendingCategory) &&
    typeof value.persona === 'string' && value.persona.trim().length > 0 &&
    typeof value.personaNote === 'string' && value.personaNote.trim().length > 0 &&
    typeof value.goal === 'string' && value.goal.trim().length >= PROFILE_LIMITS.goal.minLength && value.goal.length <= PROFILE_LIMITS.goal.maxLength &&
    goalShapeIsValid
  )
}

/** Ensures a stored profile does not smuggle Sara-only synthetic facts into a personal profile. */
export function isProfileCompatibleWithSource(profile: ActiveFinancialProfile, source: ProfileSource): boolean {
  if (source === 'personal') {
    return profile.age === undefined && profile.city === undefined && profile.goalAmountSource !== 'synthetic'
  }
  return typeof profile.age === 'number' && typeof profile.city === 'string' && profile.goalAmountSource === 'synthetic'
}

/** Copy nested spending categories before placing a profile in state. */
export function cloneFinancialProfile(profile: ActiveFinancialProfile): ActiveFinancialProfile {
  return {
    ...profile,
    spending: profile.spending.map((item) => ({ ...item })),
  }
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٬,\s]/g, '')
    .replace(/٫/g, '.')
}

/** Parse Arabic-Indic or western SAR input without accepting malformed text. */
export function parseSARInput(value: string): number {
  const normalized = normalizeDigits(value.trim())
  if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) return Number.NaN
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : Number.NaN
}

function amountError(value: unknown, min: number, max: number, label: string): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return `قيمة ${label} مطلوبة بصيغة رقمية.`
  if (value < min) return `الحد الأدنى لـ${label} هو ${min.toLocaleString('ar-SA')} ر.س.`
  if (value > max) return `الحد الأعلى لـ${label} هو ${max.toLocaleString('ar-SA')} ر.س.`
  return undefined
}

export function validateProfileDraft(draft: ProfileDraft): ProfileValidationResult {
  const errors: ProfileValidationErrors = {}
  const name = typeof draft.displayName === 'string' ? draft.displayName.trim() : ''
  if (name.length < PROFILE_LIMITS.displayName.minLength) errors.displayName = 'الاسم مطلوب لعرضه داخل التجربة.'
  else if (name.length > PROFILE_LIMITS.displayName.maxLength) errors.displayName = 'اختصر الاسم إلى ٦٠ حرفاً.'

  errors.monthlyIncome = amountError(draft.monthlyIncome, PROFILE_LIMITS.monthlyIncome.min, PROFILE_LIMITS.monthlyIncome.max, 'الدخل الشهري')
  errors.essentialSpending = amountError(draft.essentialSpending, PROFILE_LIMITS.essentialSpending.min, PROFILE_LIMITS.essentialSpending.max, 'الإنفاق الأساسي')
  errors.flexibleSpending = amountError(draft.flexibleSpending, PROFILE_LIMITS.flexibleSpending.min, PROFILE_LIMITS.flexibleSpending.max, 'الإنفاق المرن')
  errors.currentSavings = amountError(draft.currentSavings, PROFILE_LIMITS.currentSavings.min, PROFILE_LIMITS.currentSavings.max, 'المدخرات الحالية')
  errors.existingMonthlyDebtObligations = amountError(
    draft.existingMonthlyDebtObligations,
    PROFILE_LIMITS.existingMonthlyDebtObligations.min,
    PROFILE_LIMITS.existingMonthlyDebtObligations.max,
    'الالتزامات الشهرية',
  )
  errors.monthlyInvestment = amountError(draft.monthlyInvestment, PROFILE_LIMITS.monthlyInvestment.min, PROFILE_LIMITS.monthlyInvestment.max, 'الادخار أو الاستثمار الشهري')

  const goal = typeof draft.goal === 'string' ? draft.goal.trim() : ''
  if (goal.length < PROFILE_LIMITS.goal.minLength) errors.goal = 'هدف واحد واضح مطلوب للتجربة.'
  else if (goal.length > PROFILE_LIMITS.goal.maxLength) errors.goal = 'اختصر الهدف إلى ١٢٠ حرفاً.'

  if (draft.goalAmount !== null) {
    errors.goalAmount = amountError(draft.goalAmount, PROFILE_LIMITS.goalAmount.min, PROFILE_LIMITS.goalAmount.max, 'مبلغ الهدف')
  }

  const amounts = [draft.essentialSpending, draft.flexibleSpending, draft.existingMonthlyDebtObligations, draft.monthlyInvestment]
  if (Number.isFinite(draft.monthlyIncome) && amounts.every((amount) => Number.isFinite(amount))) {
    const monthlyCommitments = amounts.reduce((sum, amount) => sum + amount, 0)
    if (monthlyCommitments > draft.monthlyIncome) {
      errors.budget = 'إجمالي الإنفاق والالتزامات أعلى من الدخل؛ خفّض رقماً واحداً على الأقل ليصبح السيناريو قابلاً للقراءة.'
    }
  }

  Object.keys(errors).forEach((key) => {
    const field = key as ProfileDraftField
    if (!errors[field]) delete errors[field]
  })
  return { valid: Object.keys(errors).length === 0, errors }
}

function firstNameFrom(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName.trim()
}

function profileIdFrom(displayName: string, source: ProfileSource): string {
  if (source === 'sara') return 'sara-riyadh-01'
  const slug = displayName
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 52)
  return `personal-${slug || 'profile'}`
}

function profileSpending(draft: ProfileDraft): SpendingCategory[] {
  return [
    { key: 'home', label: 'الإنفاق الأساسي', amount: draft.essentialSpending, color: '#3B82C4', essential: true },
    { key: 'shopping', label: 'الإنفاق المرن', amount: draft.flexibleSpending, color: '#F4B860', essential: false },
  ]
}

/** Convert the compact personal form into the deterministic profile. */
export function profileFromDraft(draft: ProfileDraft, source: ProfileSource = 'personal'): ActiveFinancialProfile {
  const normalized: ProfileDraft = {
    ...draft,
    displayName: typeof draft.displayName === 'string' ? draft.displayName.trim() : '',
    goal: typeof draft.goal === 'string' ? draft.goal.trim() : '',
    goalAmount: draft.goalAmount === undefined ? null : draft.goalAmount,
  }
  const validation = validateProfileDraft(normalized)
  if (!validation.valid) throw new RangeError(Object.values(validation.errors).filter(Boolean).join(' '))

  const monthlySpend = normalized.essentialSpending + normalized.flexibleSpending
  const monthlyRoom = normalized.monthlyIncome - monthlySpend - normalized.existingMonthlyDebtObligations - normalized.monthlyInvestment
  const savingsRate = normalized.monthlyIncome > 0 ? (monthlyRoom + normalized.monthlyInvestment) / normalized.monthlyIncome : 0
  const persona = savingsRate >= 0.2 ? 'Steady Builder' : savingsRate >= 0.1 ? 'Intentional Starter' : 'Breathing-Room Planner'
  const goalAmountSource: GoalAmountSource = normalized.goalAmount === null
    ? 'illustrative'
    : source === 'sara' ? 'synthetic' : 'personal'

  return {
    id: profileIdFrom(normalized.displayName, source),
    name: normalized.displayName,
    firstName: firstNameFrom(normalized.displayName),
    occupation: 'مستخدم فِن كويست',
    monthlyIncome: normalized.monthlyIncome,
    currentSavings: normalized.currentSavings,
    currentInvestments: 0,
    // The form asks for a monthly payment, not a balance. This is an explicit
    // 12-month educational approximation, never a claimed lender contract.
    currentDebt: normalized.existingMonthlyDebtObligations * ASSUMPTIONS.existingDebtApproximationMonths,
    currentMonthlyDebtObligations: normalized.existingMonthlyDebtObligations,
    monthlyInvestment: normalized.monthlyInvestment,
    spending: profileSpending(normalized),
    persona,
    personaNote: `قراءة تعليمية مبنية على أرقام ${normalized.displayName} التقريبية، وليست كشفاً بنكياً أو نصيحة مالية.`,
    goal: normalized.goal,
    goalAmount: normalized.goalAmount,
    goalAmountSource,
  }
}

function isProfileDraft(value: unknown): value is Omit<ProfileDraft, 'goalAmount'> & Partial<Pick<ProfileDraft, 'goalAmount'>> {
  return isRecord(value) && 'displayName' in value && 'essentialSpending' in value && 'flexibleSpending' in value && 'goal' in value
}

function normalizeDraft(value: Omit<ProfileDraft, 'goalAmount'> & Partial<Pick<ProfileDraft, 'goalAmount'>>): ProfileDraft {
  return { ...value, goalAmount: value.goalAmount === undefined ? null : value.goalAmount }
}

function normalizeProfileForSource(profile: FinancialProfile, source: ProfileSource): ActiveFinancialProfile | null {
  const rawGoalAmount = profile.goalAmount
  if (rawGoalAmount !== null && rawGoalAmount !== undefined && !isFiniteGoalAmount(rawGoalAmount)) return null
  if (profile.goalAmountSource !== undefined && !isGoalAmountSource(profile.goalAmountSource)) return null

  const goalAmount = source === 'sara' && (rawGoalAmount === undefined || rawGoalAmount === null)
    ? ASSUMPTIONS.homeDepositGoal
    : rawGoalAmount === undefined ? null : rawGoalAmount
  let goalAmountSource: GoalAmountSource = profile.goalAmountSource ?? (goalAmount === null ? 'illustrative' : source === 'sara' ? 'synthetic' : 'personal')
  if (source === 'personal' && goalAmountSource === 'synthetic') goalAmountSource = goalAmount === null ? 'illustrative' : 'personal'
  if (source === 'sara' && goalAmountSource !== 'synthetic') goalAmountSource = 'synthetic'

  const candidate: FinancialProfile = {
    ...profile,
    goal: typeof profile.goal === 'string' && profile.goal.trim() ? profile.goal.trim() : 'فهم المسار المالي بوضوح',
    goalAmount,
    goalAmountSource,
  }
  if (source === 'personal') {
    delete candidate.age
    delete candidate.city
  }
  return isActiveFinancialProfile(candidate) && isProfileCompatibleWithSource(candidate, source)
    ? cloneFinancialProfile(candidate)
    : null
}

export function coerceProfileInput(value: ActiveProfileInput, source: ProfileSource): ActiveFinancialProfile | null {
  if (isProfileDraft(value)) {
    try {
      return profileFromDraft(normalizeDraft(value), source)
    } catch {
      return null
    }
  }
  if (!isRecord(value)) return null
  return normalizeProfileForSource(value as FinancialProfile, source)
}

export function sourceForProfileInput(value: ActiveProfileInput, fallback: ProfileSource = 'personal'): ProfileSource {
  if (isProfileDraft(value)) return fallback
  return typeof value.id === 'string' && value.id.startsWith('sara-') ? 'sara' : fallback
}

export function profileToDraft(profile: ActiveFinancialProfile): ProfileDraft {
  return {
    displayName: profile.name,
    monthlyIncome: profile.monthlyIncome,
    essentialSpending: profile.spending.filter((item) => item.essential).reduce((sum, item) => sum + item.amount, 0),
    flexibleSpending: profile.spending.filter((item) => !item.essential).reduce((sum, item) => sum + item.amount, 0),
    currentSavings: profile.currentSavings,
    existingMonthlyDebtObligations: profile.currentMonthlyDebtObligations,
    monthlyInvestment: profile.monthlyInvestment,
    goal: profile.goal,
    goalAmount: profile.goalAmount,
  }
}
