import { ILLUSTRATIVE_DEFAULT_GOAL_AMOUNT } from '../data/assumptions'
import type { FinancialProfile } from '../types/finance'
import {
  cloneFinancialProfile,
  isActiveFinancialProfile,
  isProfileCompatibleWithSource,
  isProfileSource,
  type ActiveFinancialProfile,
  type ProfileSource,
} from './profile'

export const PROFILE_STORAGE_KEY = 'finquest:active-profile'
export const ACTIVE_PROFILE_VERSION = 2
export const PROFILE_STORAGE_VERSION = ACTIVE_PROFILE_VERSION
const LEGACY_PROFILE_VERSION = 1

interface StoredProfilePayload {
  version: number
  source: ProfileSource
  profile: ActiveFinancialProfile
}

export interface LoadedProfile {
  profile: ActiveFinancialProfile
  source: ProfileSource
  /** Always the current schema version after a successful migration. */
  version: number
  migratedFrom?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isCurrentPayload(value: unknown): value is StoredProfilePayload {
  if (!isRecord(value) || value.version !== ACTIVE_PROFILE_VERSION || !isProfileSource(value.source)) return false
  return isActiveFinancialProfile(value.profile) && isProfileCompatibleWithSource(value.profile, value.source)
}

/**
 * V1 stored age/city for every profile and had only a string goal. Personal
 * migrations deliberately drop those invented fields; Sara retains them as
 * explicit synthetic-demo attributes. Any malformed legacy shape fails closed.
 */
function migrateV1Profile(value: unknown): LoadedProfile | null {
  if (!isRecord(value) || value.version !== LEGACY_PROFILE_VERSION || !isProfileSource(value.source) || !isRecord(value.profile)) return null

  const source = value.source
  const legacy = value.profile as Record<string, unknown>
  const candidate: Record<string, unknown> = {
    ...legacy,
    goalAmount: source === 'sara' ? ILLUSTRATIVE_DEFAULT_GOAL_AMOUNT : null,
    goalAmountSource: source === 'sara' ? 'synthetic' : 'illustrative',
  }
  if (source === 'personal') {
    delete candidate.age
    delete candidate.city
  }

  if (!isActiveFinancialProfile(candidate) || !isProfileCompatibleWithSource(candidate, source)) return null
  return {
    profile: cloneFinancialProfile(candidate),
    source,
    version: ACTIVE_PROFILE_VERSION,
    migratedFrom: LEGACY_PROFILE_VERSION,
  }
}

/** Load v2 directly or migrate the one known v1 profile shape. Unknown versions fail closed. */
export function loadPersistedProfile(): LoadedProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return null
    const payload: unknown = JSON.parse(raw)
    if (isCurrentPayload(payload)) {
      return { profile: cloneFinancialProfile(payload.profile), source: payload.source, version: payload.version }
    }
    return migrateV1Profile(payload)
  } catch {
    return null
  }
}

/** Persistence is intentionally best effort; in-memory state remains usable when storage is unavailable. */
export function persistProfile(profile: ActiveFinancialProfile | null, source: ProfileSource | null): void {
  if (typeof window === 'undefined') return
  try {
    if (!profile) {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY)
      return
    }
    const resolvedSource = source ?? 'personal'
    if (!isProfileCompatibleWithSource(profile, resolvedSource)) return
    const payload: StoredProfilePayload = {
      version: ACTIVE_PROFILE_VERSION,
      source: resolvedSource,
      profile,
    }
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Browser privacy settings and quota errors are non-fatal.
  }
}

export function clearPersistedProfile(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY)
  } catch {
    // Reset should still succeed in memory when localStorage is unavailable.
  }
}

/** Useful only at typed integration boundaries that still provide a raw profile. */
export type StoredProfileInput = FinancialProfile
