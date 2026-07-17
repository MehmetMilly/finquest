import type { ScenarioResult } from '../types/finance'
import type { AvatarMood } from './FutureAvatar'

export interface AvatarMoodEvent {
  type?: string
  severity?: 'low' | 'medium' | 'high'
  outcome?: 'positive' | 'negative' | 'neutral'
}

export type AvatarScreen =
  | 'landing'
  | 'profile'
  | 'dna'
  | 'decision'
  | 'futures'
  | 'ripple'
  | 'council'
  | 'quest'
  | 'result'

export interface AvatarMoodResolverInput {
  scenario?: Pick<ScenarioResult, 'stressScore' | 'healthScore' | 'id' | 'mood' | 'goalDelayMonths' | 'opportunityCost'> | null
  screen?: AvatarScreen | string | null
  event?: AvatarMoodEvent | string | null
}

const screenMoods: Record<string, AvatarMood> = {
  landing: 'encouraging',
  profile: 'calm',
  dna: 'focused',
  decision: 'thinking',
  futures: 'worried',
  ripple: 'warning',
  council: 'thinking',
  quest: 'proud',
  result: 'celebrating',
}

/**
 * Turns simulation state and a lightweight UI/event context into one stable,
 * human-readable avatar mood. Explicit events intentionally win over inferred data.
 */
export function resolveAvatarMood({ scenario, screen, event }: AvatarMoodResolverInput = {}): AvatarMood {
  const eventText = typeof event === 'string' ? event : event?.type ?? ''
  const eventDetails = typeof event === 'string' ? undefined : event
  const normalizedEvent = eventText.toLowerCase()

  if (/(celebrat|success|complete|win|approved)/.test(normalizedEvent) || eventDetails?.outcome === 'positive') return 'celebrating'
  if (/(warn|risk|alert|deadline|balloon)/.test(normalizedEvent) || eventDetails?.severity === 'high') return 'warning'
  if (/(stress|overwhelm|pressure)/.test(normalizedEvent)) return 'stressed'
  if (/(relief|resolve|recovered)/.test(normalizedEvent)) return 'relieved'
  if (/(question|consider|compare)/.test(normalizedEvent)) return 'thinking'

  if (scenario) {
    if (scenario.stressScore >= 78 || scenario.healthScore <= 28) return 'stressed'
    if (scenario.stressScore >= 58 || scenario.goalDelayMonths >= 18) return 'worried'
    if (scenario.healthScore >= 82 && scenario.opportunityCost === 0) return 'proud'
    if (scenario.id === 'delay') return 'encouraging'
    if (scenario.mood === 'compressed') return 'warning'
    if (scenario.mood === 'open') return 'relieved'
  }

  return screenMoods[String(screen ?? '').toLowerCase()] ?? 'calm'
}

