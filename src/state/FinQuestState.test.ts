import { afterEach, describe, expect, it, vi } from 'vitest'
import { ASSUMPTIONS, ILLUSTRATIVE_DEFAULT_GOAL_AMOUNT } from '../data/assumptions'
import { primaryProfile } from '../data/mockProfiles'
import {
  DEFAULT_PROFILE_DRAFT,
  isActiveFinancialProfile,
  isProfileCompatibleWithSource,
  parseSARInput,
  profileFromDraft,
  validateProfileDraft,
} from './profile'
import { ACTIVE_PROFILE_VERSION, PROFILE_STORAGE_KEY, loadPersistedProfile } from './profileStorage'

afterEach(() => {
  vi.unstubAllGlobals()
})

function installStorage() {
  const storage = new Map<string, string>()
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  })
  return storage
}

describe('personalized profile mapping', () => {
  it('keeps personal age and city uncollected while using an illustrative target when amount is omitted', () => {
    const draft = { ...DEFAULT_PROFILE_DRAFT, displayName: 'نورة' }
    expect(validateProfileDraft(draft)).toEqual({ valid: true, errors: {} })

    const profile = profileFromDraft(draft)
    expect(profile.name).toBe('نورة')
    expect(profile.firstName).toBe('نورة')
    expect(profile.age).toBeUndefined()
    expect(profile.city).toBeUndefined()
    expect(profile.goal).toBe(DEFAULT_PROFILE_DRAFT.goal)
    expect(profile.goalAmount).toBeNull()
    expect(profile.goalAmountSource).toBe('illustrative')
    expect(profile.currentDebt).toBe(0)
    expect(isActiveFinancialProfile(profile)).toBe(true)
    expect(isProfileCompatibleWithSource(profile, 'personal')).toBe(true)
  })

  it('uses a provided goal amount and makes the 12-month debt approximation explicit in the mapped model', () => {
    const profile = profileFromDraft({
      ...DEFAULT_PROFILE_DRAFT,
      displayName: 'ريم',
      goalAmount: 75_000,
      existingMonthlyDebtObligations: 1_250,
    })

    expect(profile.goalAmount).toBe(75_000)
    expect(profile.goalAmountSource).toBe('personal')
    expect(profile.currentDebt).toBe(1_250 * ASSUMPTIONS.existingDebtApproximationMonths)
    expect(ASSUMPTIONS.existingDebtApproximationMonths).toBe(12)
  })

  it('parses Arabic-Indic digits and rejects budget and optional-goal mistakes', () => {
    expect(parseSARInput('٧٬٠٠٠')).toBe(7_000)
    expect(parseSARInput('not-a-number')).toBeNaN()

    const invalidBudget = validateProfileDraft({
      ...DEFAULT_PROFILE_DRAFT,
      displayName: 'شخص',
      monthlyIncome: 5_000,
      essentialSpending: 3_000,
      flexibleSpending: 2_500,
    })
    expect(invalidBudget.valid).toBe(false)
    expect(invalidBudget.errors.budget).toContain('أعلى من الدخل')

    const invalidGoal = validateProfileDraft({ ...DEFAULT_PROFILE_DRAFT, displayName: 'شخص', goalAmount: 0 })
    expect(invalidGoal.valid).toBe(false)
    expect(invalidGoal.errors.goalAmount).toContain('الحد الأدنى')
  })

  it('keeps Sara synthetic, including an explicit synthetic goal label and amount', () => {
    expect(isActiveFinancialProfile(primaryProfile)).toBe(true)
    expect(isProfileCompatibleWithSource(primaryProfile, 'sara')).toBe(true)
    expect(primaryProfile.goal).toBeTruthy()
    expect(primaryProfile.goalAmount).toBe(ILLUSTRATIVE_DEFAULT_GOAL_AMOUNT)
    expect(primaryProfile.goalAmountSource).toBe('synthetic')
    expect(isActiveFinancialProfile({ ...primaryProfile, monthlyIncome: Number.POSITIVE_INFINITY })).toBe(false)
  })
})

describe('versioned profile persistence', () => {
  it('loads a matching v2 profile envelope only when its source-compatible profile is valid', () => {
    const profile = profileFromDraft({ ...DEFAULT_PROFILE_DRAFT, displayName: 'ريم' })
    const storage = installStorage()

    storage.set(PROFILE_STORAGE_KEY, JSON.stringify({ version: ACTIVE_PROFILE_VERSION, source: 'personal', profile }))
    expect(loadPersistedProfile()).toMatchObject({ source: 'personal', version: ACTIVE_PROFILE_VERSION, profile: { name: 'ريم' } })

    storage.set(PROFILE_STORAGE_KEY, JSON.stringify({ version: ACTIVE_PROFILE_VERSION, source: 'personal', profile: { ...profile, age: 25 } }))
    expect(loadPersistedProfile()).toBeNull()

    storage.set(PROFILE_STORAGE_KEY, JSON.stringify({ version: ACTIVE_PROFILE_VERSION + 1, source: 'personal', profile }))
    expect(loadPersistedProfile()).toBeNull()
  })

  it('migrates valid v1 personal data by removing invented age/city and adding the illustrative goal semantics', () => {
    const profile = profileFromDraft({ ...DEFAULT_PROFILE_DRAFT, displayName: 'ريم' })
    const legacyProfile: Record<string, unknown> = { ...profile }
    delete legacyProfile.goalAmount
    delete legacyProfile.goalAmountSource
    const storage = installStorage()
    storage.set(PROFILE_STORAGE_KEY, JSON.stringify({
      version: 1,
      source: 'personal',
      profile: { ...legacyProfile, age: 25, city: 'الرياض' },
    }))

    const migrated = loadPersistedProfile()
    expect(migrated).toMatchObject({ source: 'personal', version: ACTIVE_PROFILE_VERSION, migratedFrom: 1 })
    expect(migrated?.profile.age).toBeUndefined()
    expect(migrated?.profile.city).toBeUndefined()
    expect(migrated?.profile.goalAmount).toBeNull()
    expect(migrated?.profile.goalAmountSource).toBe('illustrative')
  })

  it('migrates only a well-formed v1 Sara payload and assigns its synthetic goal amount', () => {
    const legacyProfile: Record<string, unknown> = { ...primaryProfile }
    delete legacyProfile.goalAmount
    delete legacyProfile.goalAmountSource
    const storage = installStorage()
    storage.set(PROFILE_STORAGE_KEY, JSON.stringify({ version: 1, source: 'sara', profile: legacyProfile }))

    const migrated = loadPersistedProfile()
    expect(migrated?.profile.goalAmount).toBe(ILLUSTRATIVE_DEFAULT_GOAL_AMOUNT)
    expect(migrated?.profile.goalAmountSource).toBe('synthetic')
    expect(migrated?.profile.age).toBe(23)

    storage.set(PROFILE_STORAGE_KEY, JSON.stringify({ version: 1, source: 'sara', profile: { ...legacyProfile, city: '' } }))
    expect(loadPersistedProfile()).toBeNull()
  })
})
