import { describe, expect, it } from 'vitest'
import { primaryProfile } from '../data/mockProfiles'
import {
  QUEST_CATALOG,
  badgeIdsForState,
  canCompleteQuest,
  completeQuest,
  consistencyForCompletedCount,
  createQuestState,
  levelForXp,
  nextLevelXp,
  normalizeQuestState,
  recordQuestProgress,
  recommendQuests,
  startQuest,
  xpIntoLevel,
} from './quests'

describe('quest loop domain', () => {
  it('creates a complete serializable state with no active quest', () => {
    const state = createQuestState()

    expect(state.activeQuestId).toBeNull()
    expect(Object.keys(state.progressByQuest)).toHaveLength(QUEST_CATALOG.length)
    expect(state.xp).toBe(0)
    expect(state.level).toBe(1)
    expect(state.consistency).toBe(0)
    expect(state.badges).toEqual([])
  })

  it('keeps one active quest while retaining progress on a switched quest', () => {
    const started = startQuest(createQuestState(), 'buffer-first', '2036-07-15T08:00:00.000Z')
    const progressed = recordQuestProgress(started, 500)
    const switched = startQuest(progressed, 'home-meal', '2036-07-15T09:00:00.000Z')

    expect(switched.activeQuestId).toBe('home-meal')
    expect(switched.progressByQuest['buffer-first'].current).toBe(500)
    expect(switched.progressByQuest['buffer-first'].started).toBe(true)
    expect(switched.progressByQuest['home-meal'].startedAt).toBe('2036-07-15T09:00:00.000Z')
    expect(recordQuestProgress(switched, 1, 'buffer-first')).toEqual(switched)
  })

  it('caps manual progress and awards XP, level, streak, consistency, and badges only on explicit completion', () => {
    const started = startQuest(createQuestState(), 'buffer-first', '2036-07-15T08:00:00.000Z')
    const halfway = recordQuestProgress(started, 700)
    expect(halfway.progressByQuest['buffer-first'].current).toBe(700)
    expect(canCompleteQuest(halfway)).toBe(false)
    expect(halfway.xp).toBe(0)

    const ready = recordQuestProgress(halfway, 900)
    expect(ready.progressByQuest['buffer-first'].current).toBe(1_500)
    expect(canCompleteQuest(ready)).toBe(true)

    const completed = completeQuest(ready, undefined, '2036-07-16T08:00:00.000Z')
    expect(completed.progressByQuest['buffer-first']).toMatchObject({
      current: 1_500,
      completed: true,
      selfReported: true,
      completedAt: '2036-07-16T08:00:00.000Z',
    })
    expect(completed.xp).toBe(120)
    expect(completed.level).toBe(1)
    expect(completed.streak).toBe(1)
    expect(completed.consistency).toBe(25)
    expect(completed.badges).toEqual(['first-step', 'buffer-builder'])
    expect(completeQuest(completed)).toEqual(completed)
  })

  it('derives stable recommendations from profile spending and obligations', () => {
    const highTransport = {
      ...primaryProfile,
      currentSavings: 40_000,
      currentDebt: 20_000,
      spending: primaryProfile.spending.map((item) => item.key === 'transport' ? { ...item, amount: 2_500 } : item),
    }
    const recommendations = recommendQuests(highTransport)
    expect(recommendations).toHaveLength(QUEST_CATALOG.length)
    expect(recommendations[0].id).toBe('car-delay')
    expect(recommendations.every((item) => item.reason.length > 0 && Number.isFinite(item.score))).toBe(true)
    expect(recommendQuests(highTransport, 2)).toHaveLength(2)
  })

  it('normalizes partially persisted records without trusting impossible completion', () => {
    const normalized = normalizeQuestState({
      activeQuestId: 'cooling-off',
      xp: 280,
      streak: 3,
      progressByQuest: {
        ...createQuestState().progressByQuest,
        'cooling-off': { current: 99, started: true, completed: true, selfReported: true, startedAt: 'start', completedAt: 'done' },
      },
    })

    expect(normalized.activeQuestId).toBe('cooling-off')
    expect(normalized.progressByQuest['cooling-off']).toMatchObject({ current: 3, completed: true, selfReported: true })
    expect(normalized.consistency).toBe(25)
    expect(normalized.level).toBe(2)
    expect(normalized.badges).toContain('first-step')
  })

  it('keeps gamification thresholds transparent and bounded', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(249)).toBe(1)
    expect(levelForXp(250)).toBe(2)
    expect(xpIntoLevel(370)).toBe(120)
    expect(nextLevelXp(370)).toBe(500)
    expect(consistencyForCompletedCount(-2)).toBe(0)
    expect(consistencyForCompletedCount(100)).toBe(100)
    expect(badgeIdsForState(createQuestState())).toEqual([])
  })
})
