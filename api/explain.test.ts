import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler, {
  __resetRateLimitsForTests,
  ARABIC_EDUCATIONAL_SYSTEM_PROMPT,
} from './explain'

const validFacts = {
  version: 1,
  focus: 'monthly_room',
  scenarioId: 'finance',
  scenario: {
    monthlyFlexibility: 1500,
    averageMonthlyVehicleObligation: 3000,
    emergencyFundMonths: 2.5,
    endingEmergencyFundMonths: 4,
    netWorth: 120000,
    stressScore: 55,
    goalReachedMonth: 24,
    goalDelayVsBestMonths: 6,
    unfundedShortfall: 0,
    unfundedMonths: 0,
  },
  comparison: {
    bestScenarioId: 'delay',
    bestNetWorth: 130000,
    netWorthDifference: 10000,
  },
} as const

function createRequest(body: unknown, method = 'POST', identifier = `test-${Math.random()}`) {
  return {
    method,
    body,
    headers: { 'x-forwarded-for': identifier },
  } as unknown as VercelRequest
}

function createResponse() {
  const state: { statusCode?: number; body?: unknown; headers: Record<string, string> } = { headers: {} }
  const response = {
    setHeader(name: string, value: string) {
      state.headers[name] = value
    },
    status(statusCode: number) {
      state.statusCode = statusCode
      return response
    },
    json(body: unknown) {
      state.body = body
      return response
    },
  } as unknown as VercelResponse
  return { response, state }
}

describe('/api/explain', () => {
  const originalKey = process.env.OPENROUTER_API_KEY

  beforeEach(() => {
    __resetRateLimitsForTests()
    process.env.OPENROUTER_API_KEY = 'test-only-key'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY
    else process.env.OPENROUTER_API_KEY = originalKey
  })

  it('sends only compact facts to the verified model and returns a validated provider reply', async () => {
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'في النموذج، الالتزام الشهري 3,000 ر.س وتبقى مساحة 1,500 ر.س.' } }] }),
    })
    vi.stubGlobal('fetch', providerFetch)
    const { response, state } = createResponse()

    await handler(createRequest(validFacts), response)

    expect(state.statusCode).toBe(200)
    expect(state.body).toEqual({ source: 'openrouter', text: 'في النموذج، الالتزام الشهري 3,000 ر.س وتبقى مساحة 1,500 ر.س.' })
    expect(providerFetch).toHaveBeenCalledOnce()
    const body = JSON.parse(providerFetch.mock.calls[0][1].body as string)
    expect(body.model).toBe('google/gemini-3.1-flash-lite')
    expect(body.max_tokens).toBe(120)
    expect(body.messages[1].content).not.toContain('profile')
    expect(body.messages[1].content).not.toContain('comparison')
    expect(body.messages[1].content).not.toContain('netWorth')
    expect(body.messages[1].content).toContain('monthlyFlexibility')
    expect(ARABIC_EDUCATIONAL_SYSTEM_PROMPT).toContain('لا تضف أو تستنتج')
  })

  it('rejects invented provider numbers instead of returning an ungrounded explanation', async () => {
    const providerFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'في النموذج، الالتزام الشهري 999 ر.س.' } }] }),
    })
    vi.stubGlobal('fetch', providerFetch)
    const { response, state } = createResponse()

    await handler(createRequest(validFacts), response)

    expect(state.statusCode).toBe(502)
    expect(state.body).toEqual({ error: 'narrative_unavailable' })
  })

  it('rejects advice-like provider text even when every number is grounded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'أنصح بتقليل الالتزام الشهري 3,000 ر.س.' } }] }),
    }))
    const { response, state } = createResponse()

    await handler(createRequest(validFacts), response)

    expect(state.statusCode).toBe(502)
    expect(state.body).toEqual({ error: 'narrative_unavailable' })
  })

  it('fails closed for malformed input without calling the provider', async () => {
    const providerFetch = vi.fn()
    vi.stubGlobal('fetch', providerFetch)
    const { response, state } = createResponse()

    await handler(createRequest({ ...validFacts, scenario: { ...validFacts.scenario, netWorth: '120000' } }), response)

    expect(state.statusCode).toBe(400)
    expect(state.body).toEqual({ error: 'invalid_request' })
    expect(providerFetch).not.toHaveBeenCalled()
  })

  it('keeps unsupported methods and missing server keys safely unavailable', async () => {
    const { response: methodResponse, state: methodState } = createResponse()
    await handler(createRequest(validFacts, 'GET'), methodResponse)
    expect(methodState.statusCode).toBe(405)

    delete process.env.OPENROUTER_API_KEY
    const { response: keyResponse, state: keyState } = createResponse()
    await handler(createRequest(validFacts), keyResponse)
    expect(keyState.statusCode).toBe(503)
    expect(keyState.body).toEqual({ error: 'narrative_unavailable' })
  })

  it('bounds repeated requests within one server instance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'في النموذج، الالتزام الشهري 3,000 ر.س.' } }] }),
    }))

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { response, state } = createResponse()
      await handler(createRequest(validFacts, 'POST', 'same-client'), response)
      expect(state.statusCode).toBe(200)
    }

    const { response, state } = createResponse()
    await handler(createRequest(validFacts, 'POST', 'same-client'), response)
    expect(state.statusCode).toBe(429)
    expect(state.body).toEqual({ error: 'rate_limited' })
  })
})
