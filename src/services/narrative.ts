import { formatMonths, formatSAR } from '../lib/formatters'
import type { FinancialDNA, FinancialProfile, ScenarioId, ScenarioResult } from '../types/finance'
import {
  MAX_NARRATIVE_CHARACTERS,
  NARRATIVE_API_PATH,
  type CompactNarrativeFacts,
  type NarrativeFocus,
} from './narrativeContract'
export {
  MAX_NARRATIVE_CHARACTERS,
  NARRATIVE_API_PATH,
  NARRATIVE_MODEL,
  type CompactNarrativeFacts,
  type NarrativeFocus,
} from './narrativeContract'

export interface GroundedNarrativeReply {
  text: string
  /** `fallback` is complete local deterministic copy, not a degraded calculation. */
  source: 'openrouter' | 'fallback'
}

export interface NarrativeRequestOptions {
  /** Primarily for an integration test or alternate same-origin transport. */
  fetchImpl?: typeof fetch
}

const scenarioNames: Record<ScenarioId, string> = {
  finance: 'تمويل الآن',
  used: 'شراء أذكى',
  delay: 'بناء الدفعة أولًا',
}

const REQUEST_CACHE_TTL_MS = 90_000
const REQUEST_CACHE_LIMIT = 24

const requestCache = new Map<string, { expiresAt: number; reply: GroundedNarrativeReply }>()

function roundMoney(value: number) {
  return Math.round(value)
}

function roundMonths(value: number) {
  return Math.round(value * 10) / 10
}

function cacheKey(facts: CompactNarrativeFacts) {
  return JSON.stringify(facts)
}

function pruneRequestCache(now: number) {
  for (const [key, entry] of requestCache) {
    if (entry.expiresAt <= now) requestCache.delete(key)
  }
  while (requestCache.size >= REQUEST_CACHE_LIMIT) {
    const oldest = requestCache.keys().next().value
    if (!oldest) break
    requestCache.delete(oldest)
  }
}

function isApiReply(value: unknown): value is { text: string; source: 'openrouter' } {
  if (!value || typeof value !== 'object') return false
  const response = value as Record<string, unknown>
  return (
    response.source === 'openrouter' &&
    typeof response.text === 'string' &&
    response.text.trim().length > 0 &&
    response.text.trim().length <= MAX_NARRATIVE_CHARACTERS
  )
}

/**
 * Builds a losslessly traceable snapshot from existing simulation output. Values
 * are only rounded for display/model-copy stability; calculations stay in the
 * simulation engine.
 */
export function buildCompactNarrativeFacts(
  results: ScenarioResult[],
  scenarioId?: ScenarioId,
  focus: NarrativeFocus = 'monthly_room',
): CompactNarrativeFacts | null {
  const active = results.find((result) => result.id === scenarioId) ?? results[0]
  if (!active) return null

  const best = [...results].sort((left, right) => right.netWorth - left.netWorth)[0] ?? active

  return {
    version: 1,
    focus,
    scenarioId: active.id,
    scenario: {
      monthlyFlexibility: roundMoney(active.monthlyFlexibility),
      averageMonthlyVehicleObligation: roundMoney(active.averageMonthlyVehicleObligation),
      emergencyFundMonths: roundMonths(active.emergencyFundMonths),
      endingEmergencyFundMonths: roundMonths(active.endingEmergencyFundMonths),
      netWorth: roundMoney(active.netWorth),
      stressScore: Math.round(active.stressScore),
      goalReachedMonth: active.goalReachedMonth,
      goalDelayVsBestMonths: active.goalDelayVsBestMonths,
      unfundedShortfall: roundMoney(active.unfundedShortfall),
      unfundedMonths: Math.round(active.unfundedMonths),
    },
    comparison: {
      bestScenarioId: best.id,
      bestNetWorth: roundMoney(best.netWorth),
      netWorthDifference: roundMoney(Math.max(0, best.netWorth - active.netWorth)),
    },
  }
}

/**
 * The baseline response used before the network returns and after every API
 * failure. It is intentionally built only from `CompactNarrativeFacts`.
 */
export function createDeterministicNarrativeFallback(facts: CompactNarrativeFacts): GroundedNarrativeReply {
  const selectedName = scenarioNames[facts.scenarioId]
  const bestName = scenarioNames[facts.comparison.bestScenarioId]

  if (facts.focus === 'emergency_fund') {
    const goalLine = facts.scenario.goalReachedMonth === null
      ? 'ولا يصل الهدف المالي المحسوب داخل أفق النموذج.'
      : facts.scenario.goalDelayVsBestMonths && facts.scenario.goalDelayVsBestMonths > 0
        ? `ويتأخر عن أسرع مسار بـ ${formatMonths(facts.scenario.goalDelayVsBestMonths)}.`
        : 'ويصل الهدف المالي المحسوب في الموعد داخل النموذج.'
    return {
      source: 'fallback',
      text: `في مسار «${selectedName}»، أقل احتياطي للطوارئ ${facts.scenario.emergencyFundMonths.toLocaleString('en-SA', { maximumFractionDigits: 1 })} شهر، وينتهي عند ${facts.scenario.endingEmergencyFundMonths.toLocaleString('en-SA', { maximumFractionDigits: 1 })} شهر. ${goalLine}`,
    }
  }

  if (facts.focus === 'comparison') {
    const difference = facts.comparison.netWorthDifference
    const differenceLine = difference === 0
      ? 'ولا يظهر فرق في صافي الثروة المحسوب بينهما.'
      : `والفرق في صافي الثروة المحسوب ${formatSAR(difference)}.`
    return {
      source: 'fallback',
      text: `أعلى مسار في هذا النموذج هو «${bestName}». مسار «${selectedName}» ينتهي عند ${formatSAR(facts.scenario.netWorth)}، ${differenceLine}`,
    }
  }

  const shortfallLine = facts.scenario.unfundedShortfall > 0
    ? ` ويسجل النموذج عجزًا غير مغطى ${formatSAR(facts.scenario.unfundedShortfall)} خلال ${formatMonths(facts.scenario.unfundedMonths)}.`
    : ''
  return {
    source: 'fallback',
    text: `في مسار «${selectedName}»، الالتزام الشهري المحسوب ${formatSAR(facts.scenario.averageMonthlyVehicleObligation)} وتبقى مساحة شهرية ${formatSAR(facts.scenario.monthlyFlexibility)}.${shortfallLine}`,
  }
}

/**
 * Same-origin, opt-in explanation request. The app can render the local reply
 * immediately and replace it only when the server returns a validated response.
 */
export async function requestGroundedNarrative(
  facts: CompactNarrativeFacts,
  options: NarrativeRequestOptions = {},
): Promise<GroundedNarrativeReply> {
  const now = Date.now()
  const key = cacheKey(facts)
  const cached = requestCache.get(key)
  if (cached && cached.expiresAt > now) return cached.reply

  const fallback = createDeterministicNarrativeFallback(facts)
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  if (typeof fetchImpl !== 'function') return fallback

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)

  try {
    const response = await fetchImpl(NARRATIVE_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facts),
      signal: controller.signal,
    })
    if (!response.ok) return fallback

    const payload: unknown = await response.json()
    if (!isApiReply(payload)) return fallback

    const reply: GroundedNarrativeReply = { source: 'openrouter', text: payload.text.trim() }
    pruneRequestCache(now)
    requestCache.set(key, { expiresAt: now + REQUEST_CACHE_TTL_MS, reply })
    return reply
  } catch {
    // Network and server errors deliberately leave the deterministic experience intact.
    return fallback
  } finally {
    clearTimeout(timeout)
  }
}

/** Useful when a new simulation replaces the calculated facts in the UI. */
export function clearNarrativeRequestCache() {
  requestCache.clear()
}

export function generateFutureSelfIntro(profile: FinancialProfile, dna: FinancialDNA) {
  return [
    `I’m ${profile.firstName} in 2036. I’m not here to scare you.`,
    `I’m here to show you what your choices become. Right now, you have ${formatSAR(dna.monthlySurplus)} of monthly breathing room.`,
  ]
}

export function generateCouncilDebate(results: ScenarioResult[]) {
  const financed = results.find((item) => item.id === 'finance')!
  const used = results.find((item) => item.id === 'used')!
  const delayed = results.find((item) => item.id === 'delay')!
  return [
    {
      id: financed.id,
      speaker: financed.futureTitle,
      line: `“I got the car today. But I gave up ${formatSAR(financed.opportunityCost)} of possible 2036 net worth—and five years felt tighter.”`,
    },
    {
      id: used.id,
      speaker: used.futureTitle,
      line: `“I chose the useful part: mobility. I kept ${formatSAR(used.netWorth)} in projected net worth and recovered sooner.”`,
    },
    {
      id: delayed.id,
      speaker: delayed.futureTitle,
      line: `“I didn’t say no. I said not yet. That one year protected the future fund.”`,
    },
  ]
}
