import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  MAX_NARRATIVE_CHARACTERS,
  NARRATIVE_MODEL,
  type CompactNarrativeFacts,
  type NarrativeFocus,
} from '../src/services/narrativeContract.js'
import type { ScenarioId } from '../src/types/finance.js'

const OPENROUTER_CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions'
const PROVIDER_TIMEOUT_MS = 4_500
const MAX_OUTPUT_TOKENS = 120
const MAX_PROVIDER_TEXT_CHARACTERS = 360
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 6
const MAX_ABS_MONEY = 1_000_000_000
const MAX_MONTHS = 1_200

const SCENARIO_IDS: readonly ScenarioId[] = ['finance', 'used', 'delay']
const FOCUSES: readonly NarrativeFocus[] = ['monthly_room', 'emergency_fund', 'comparison']

/**
 * The model receives only an enum-and-number JSON snapshot. It never receives
 * profile data, user-written prompts, transaction rows, or a key.
 */
export const ARABIC_EDUCATIONAL_SYSTEM_PROMPT = `أنت مفسر تعليمي عربي داخل تجربة مالية تفاعلية. اشرح الحقائق المحسوبة المرسلة لك فقط، في جملتين قصيرتين وبالعربية الواضحة.

قواعد إلزامية:
- لا تضف أو تستنتج أو تقرّب أي رقم. انسخ الأرقام الموجودة في FACTS_JSON فقط وبالأرقام، ولا تستخدم كلمات الأعداد.
- لا تقدّم نصيحة أو توصية أو أمرًا، ولا تتنبأ بالمستقبل ولا تعد بنتيجة.
- لا تذكر معلومات خارج FACTS_JSON ولا تفترض تفاصيل شخصية.
- قل "في النموذج" أو "محسوب" عند وصف الأثر المالي.
- لا تستخدم عناوين أو نقاطًا أو Markdown أو رموزًا تعبيرية.
- يجب ألا يتجاوز الرد 320 حرفًا.`

interface RateLimitBucket {
  startedAt: number
  count: number
}

interface ProviderResponse {
  choices?: Array<{
    message?: {
      content?: unknown
    }
  }>
}

const rateLimitBuckets = new Map<string, RateLimitBucket>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === 'string' && SCENARIO_IDS.includes(value as ScenarioId)
}

function isFocus(value: unknown): value is NarrativeFocus {
  return typeof value === 'string' && FOCUSES.includes(value as NarrativeFocus)
}

function isBoundedNumber(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
}

function isBoundedIntegerOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_MONTHS)
}

/** Guards the endpoint from arbitrary chat prompts and unbounded numeric payloads. */
export function parseCompactNarrativeFacts(value: unknown): CompactNarrativeFacts | null {
  if (!isRecord(value) || value.version !== 1 || !isFocus(value.focus) || !isScenarioId(value.scenarioId)) return null
  if (!isRecord(value.scenario) || !isRecord(value.comparison)) return null

  const scenario = value.scenario
  const comparison = value.comparison
  const validScenario =
    isBoundedNumber(scenario.monthlyFlexibility, -MAX_ABS_MONEY, MAX_ABS_MONEY) &&
    isBoundedNumber(scenario.averageMonthlyVehicleObligation, 0, MAX_ABS_MONEY) &&
    isBoundedNumber(scenario.emergencyFundMonths, 0, MAX_MONTHS) &&
    isBoundedNumber(scenario.endingEmergencyFundMonths, 0, MAX_MONTHS) &&
    isBoundedNumber(scenario.netWorth, -MAX_ABS_MONEY, MAX_ABS_MONEY) &&
    isBoundedNumber(scenario.stressScore, 0, 100) &&
    isBoundedIntegerOrNull(scenario.goalReachedMonth) &&
    isBoundedIntegerOrNull(scenario.goalDelayVsBestMonths) &&
    isBoundedNumber(scenario.unfundedShortfall, 0, MAX_ABS_MONEY) &&
    isBoundedNumber(scenario.unfundedMonths, 0, MAX_MONTHS)
  const validComparison =
    isScenarioId(comparison.bestScenarioId) &&
    isBoundedNumber(comparison.bestNetWorth, -MAX_ABS_MONEY, MAX_ABS_MONEY) &&
    isBoundedNumber(comparison.netWorthDifference, 0, MAX_ABS_MONEY)

  if (!validScenario || !validComparison) return null

  return {
    version: 1,
    focus: value.focus,
    scenarioId: value.scenarioId,
    scenario: {
      monthlyFlexibility: scenario.monthlyFlexibility as number,
      averageMonthlyVehicleObligation: scenario.averageMonthlyVehicleObligation as number,
      emergencyFundMonths: scenario.emergencyFundMonths as number,
      endingEmergencyFundMonths: scenario.endingEmergencyFundMonths as number,
      netWorth: scenario.netWorth as number,
      stressScore: scenario.stressScore as number,
      goalReachedMonth: scenario.goalReachedMonth as number | null,
      goalDelayVsBestMonths: scenario.goalDelayVsBestMonths as number | null,
      unfundedShortfall: scenario.unfundedShortfall as number,
      unfundedMonths: scenario.unfundedMonths as number,
    },
    comparison: {
      bestScenarioId: comparison.bestScenarioId as ScenarioId,
      bestNetWorth: comparison.bestNetWorth as number,
      netWorthDifference: comparison.netWorthDifference as number,
    },
  }
}

function compactProviderFacts(facts: CompactNarrativeFacts) {
  const identity = { focus: facts.focus, scenarioId: facts.scenarioId }

  if (facts.focus === 'monthly_room') {
    return {
      ...identity,
      monthlyFlexibility: facts.scenario.monthlyFlexibility,
      averageMonthlyVehicleObligation: facts.scenario.averageMonthlyVehicleObligation,
    }
  }

  if (facts.focus === 'emergency_fund') {
    return {
      ...identity,
      emergencyFundMonths: facts.scenario.emergencyFundMonths,
      endingEmergencyFundMonths: facts.scenario.endingEmergencyFundMonths,
      stressScore: facts.scenario.stressScore,
    }
  }

  return {
    ...identity,
    scenarioNetWorth: facts.scenario.netWorth,
    bestScenarioId: facts.comparison.bestScenarioId,
    bestNetWorth: facts.comparison.bestNetWorth,
    netWorthDifference: facts.comparison.netWorthDifference,
  }
}

function anonymizedIdentifier(rawIdentifier: string) {
  // A short non-cryptographic bucket key avoids retaining the raw IP in memory.
  let hash = 2_166_136_261
  for (let index = 0; index < rawIdentifier.length; index += 1) {
    hash ^= rawIdentifier.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return `r${(hash >>> 0).toString(36)}`
}

function requestBucketKey(request: VercelRequest) {
  const forwarded = request.headers['x-forwarded-for']
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]
  return anonymizedIdentifier(firstForwarded?.trim() || 'unknown-client')
}

function isWithinRateLimit(request: VercelRequest, now = Date.now()) {
  for (const [key, bucket] of rateLimitBuckets) {
    if (now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) rateLimitBuckets.delete(key)
  }

  const key = requestBucketKey(request)
  const bucket = rateLimitBuckets.get(key)
  if (!bucket) {
    rateLimitBuckets.set(key, { startedAt: now, count: 1 })
    return true
  }
  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) return false
  bucket.count += 1
  return true
}

function normalizeDigits(value: string) {
  const arabicIndic = '٠١٢٣٤٥٦٧٨٩'
  const easternArabicIndic = '۰۱۲۳۴۵۶۷۸۹'
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicIndic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicIndic.indexOf(digit)))
}

function numericValuesInFacts(facts: CompactNarrativeFacts) {
  const values = [
    facts.scenario.monthlyFlexibility,
    facts.scenario.averageMonthlyVehicleObligation,
    facts.scenario.emergencyFundMonths,
    facts.scenario.endingEmergencyFundMonths,
    facts.scenario.netWorth,
    facts.scenario.stressScore,
    facts.scenario.goalReachedMonth,
    facts.scenario.goalDelayVsBestMonths,
    facts.scenario.unfundedShortfall,
    facts.scenario.unfundedMonths,
    facts.comparison.bestNetWorth,
    facts.comparison.netWorthDifference,
  ]
  return values.filter((value): value is number => typeof value === 'number')
}

function containsOnlyFactNumbers(text: string, facts: CompactNarrativeFacts) {
  const allowed = numericValuesInFacts(facts)
  const normalized = normalizeDigits(text)
  const tokens = normalized.match(/[−-]?(?:\d{1,3}(?:[,٬]\d{3})+|\d+)(?:[.٫]\d+)?/g) ?? []
  return tokens.every((token) => {
    const numeric = Number(token.replace(/[٬,]/g, '').replace('٫', '.').replace('−', '-'))
    return Number.isFinite(numeric) && allowed.some((value) => Math.abs(value - numeric) < 0.000_001)
  })
}

const NUMBER_WORD_PATTERN = /(?:صفر|واحد|واحدة|اثنان|اثنين|اثنتان|اثنتين|ثلاثة|ثلاث|أربعة|اربع|خمسة|خمس|ستة|ست|سبعة|سبع|ثمانية|ثمان|تسعة|تسع|عشرة|عشر|مئة|مائة|ألف|مليون)/u
const ADVICE_OR_PREDICTION_PATTERN = /(?:أنصح|ننصح|يجب|لازم|الأفضل|استثمر|اشتر|تجنّب|تجنب|ادخر|وفّر|سوف|سيزيد|سينخفض|مضمون|أكيد|توقّع)/u

/** Reject a response rather than risk displaying a made-up number or advice. */
export function validateProviderNarrative(text: unknown, facts: CompactNarrativeFacts): string | null {
  if (typeof text !== 'string') return null
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized || normalized.length > MAX_PROVIDER_TEXT_CHARACTERS || normalized.length > MAX_NARRATIVE_CHARACTERS) return null
  if (!/[\u0600-\u06FF]/u.test(normalized) || /[<>`]/u.test(normalized)) return null
  if (NUMBER_WORD_PATTERN.test(normalized) || ADVICE_OR_PREDICTION_PATTERN.test(normalized)) return null
  if (!containsOnlyFactNumbers(normalized, facts)) return null
  return normalized
}

async function callOpenRouter(facts: CompactNarrativeFacts, apiKey: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)
  try {
    const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'FinQuest educational narrative',
      },
      body: JSON.stringify({
        model: NARRATIVE_MODEL,
        temperature: 0,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: 'system', content: ARABIC_EDUCATIONAL_SYSTEM_PROMPT },
          { role: 'user', content: `FACTS_JSON=${JSON.stringify(compactProviderFacts(facts))}` },
        ],
      }),
      signal: controller.signal,
    })
    if (!response.ok) return null
    const body: unknown = await response.json()
    if (!isRecord(body)) return null
    const provider = body as ProviderResponse
    return provider.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function safeError(response: VercelResponse, status: 400 | 405 | 429 | 502 | 503, code: string) {
  return response.status(status).json({ error: code })
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store, max-age=0')

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return safeError(response, 405, 'method_not_allowed')
  }
  if (!isWithinRateLimit(request)) return safeError(response, 429, 'rate_limited')

  const facts = parseCompactNarrativeFacts(request.body)
  if (!facts) return safeError(response, 400, 'invalid_request')

  // The key is read only inside this server function; it is never returned or logged.
  const apiKey = globalThis.process?.env.OPENROUTER_API_KEY
  if (!apiKey) return safeError(response, 503, 'narrative_unavailable')

  const providerText = await callOpenRouter(facts, apiKey)
  const text = validateProviderNarrative(providerText, facts)
  if (!text) return safeError(response, 502, 'narrative_unavailable')

  return response.status(200).json({ source: 'openrouter', text })
}

/** Test-only reset; it does not expose request identifiers or provider state. */
export function __resetRateLimitsForTests() {
  rateLimitBuckets.clear()
}
