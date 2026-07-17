import type { QuestId } from './quests'

/**
 * Explicit product CTAs win over the active/recommended quest. Generic Tasks
 * navigation passes no intent and therefore keeps the existing recommendation
 * behavior.
 */
export function resolveQuestSelection(
  requestedQuestId: QuestId | null | undefined,
  activeQuestId: QuestId | null | undefined,
  recommendedQuestIds: readonly QuestId[],
): QuestId {
  return requestedQuestId ?? activeQuestId ?? recommendedQuestIds[0] ?? 'buffer-first'
}
