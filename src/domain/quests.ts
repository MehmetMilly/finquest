import type { FinancialProfile } from '../types/finance'

/** The small, self-reported actions available in the prototype. */
export type QuestId = 'buffer-first' | 'car-delay' | 'cooling-off' | 'home-meal'

export type QuestCategory = 'أمان مالي' | 'قرار كبير' | 'إنفاق واعٍ'

export type QuestUnit = 'ر.س' | 'يوم' | 'مرة'

export type QuestIconName = 'shield' | 'route' | 'pause' | 'home'

export interface QuestDefinition {
  id: QuestId
  category: QuestCategory
  icon: QuestIconName
  title: string
  shortTitle: string
  description: string
  prompt: string
  target: number
  step: number
  unit: QuestUnit
  rewardXp: number
  /** A plain-language hint used by recommendation cards, not financial advice. */
  recommendationHint: string
}

export interface QuestRecommendation extends QuestDefinition {
  score: number
  reason: string
}

export interface QuestProgress {
  current: number
  started: boolean
  completed: boolean
  /** Completion is deliberately a local, self-reported action in this prototype. */
  selfReported: boolean
  startedAt: string | null
  completedAt: string | null
}

export type QuestBadgeId = 'first-step' | 'steady-rhythm' | 'buffer-builder' | 'quest-keeper'

/** Serializable state shape for the primary app store. */
export interface QuestLoopState {
  /** At most one quest is active. Switching quests does not erase saved progress. */
  activeQuestId: QuestId | null
  progressByQuest: Record<QuestId, QuestProgress>
  xp: number
  /** Consecutive completed quests in this prototype (not verified calendar days). */
  streak: number
  /** Completion share across the current four-quest set, from 0–100. */
  consistency: number
  level: number
  badges: QuestBadgeId[]
}

export interface QuestModeledEffect {
  before: number
  after: number
  delta: number
  metric?: string
  note?: string
}

export const QUEST_CATALOG: readonly QuestDefinition[] = [
  {
    id: 'buffer-first',
    category: 'أمان مالي',
    icon: 'shield',
    title: 'احمي 1,500 ر.س',
    shortTitle: 'وسادة أولى',
    description: 'احمِ هذا المبلغ في بند آمن داخل نموذجك قبل قرار السيارة.',
    prompt: 'سجّل كل 500 ر.س قررت حمايتها داخل التجربة.',
    target: 1_500,
    step: 500,
    unit: 'ر.س',
    rewardXp: 120,
    recommendationHint: 'يبني هامشاً قبل التزام كبير.',
  },
  {
    id: 'car-delay',
    category: 'قرار كبير',
    icon: 'route',
    title: 'أجّل السيارة 30 يوماً',
    shortTitle: 'مساحة للقرار',
    description: 'اترك قرار الترقية مفتوحاً شهراً واحداً وشاهد أثر الانتظار.',
    prompt: 'كل يوم تأجيل مسجّل هنا يضيف يوماً إلى مساحة القرار.',
    target: 30,
    step: 1,
    unit: 'يوم',
    rewardXp: 100,
    recommendationHint: 'يخفف ضغط القرار عندما تكون كلفة النقل مرتفعة.',
  },
  {
    id: 'cooling-off',
    category: 'إنفاق واعٍ',
    icon: 'pause',
    title: 'طبّق قاعدة 24 ساعة',
    shortTitle: 'توقّف ذكي',
    description: 'أجّل ثلاث مشتريات غير مخططة ليوم واحد قبل الدفع.',
    prompt: 'سجّل مرة واحدة كلما أعطيت رغبة شراء يوماً للتفكير.',
    target: 3,
    step: 1,
    unit: 'مرة',
    rewardXp: 70,
    recommendationHint: 'يصنع لحظة تفكير صغيرة قبل الإنفاق التلقائي.',
  },
  {
    id: 'home-meal',
    category: 'إنفاق واعٍ',
    icon: 'home',
    title: 'أربع وجبات منزلية',
    shortTitle: 'يوم بلا توصيل',
    description: 'اختر أربع وجبات منزلية هذا الأسبوع وسجّلها بنفسك.',
    prompt: 'كل وجبة منزلية تحسب خطوة واحدة في هذه المحاكاة.',
    target: 4,
    step: 1,
    unit: 'مرة',
    rewardXp: 60,
    recommendationHint: 'يحوّل بند الطعام إلى تجربة بسيطة قابلة للملاحظة.',
  },
] as const

const QUEST_BY_ID: Record<QuestId, QuestDefinition> = QUEST_CATALOG.reduce(
  (map, quest) => ({ ...map, [quest.id]: quest }),
  {} as Record<QuestId, QuestDefinition>,
)

const BADGE_ORDER: readonly QuestBadgeId[] = ['first-step', 'steady-rhythm', 'buffer-builder', 'quest-keeper']

function isQuestId(value: unknown): value is QuestId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(QUEST_BY_ID, value)
}

function emptyProgress(): QuestProgress {
  return { current: 0, started: false, completed: false, selfReported: false, startedAt: null, completedAt: null }
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum
  return Math.min(maximum, Math.max(minimum, value))
}

function toTimestamp(value?: string | Date): string {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && value.length > 0) return value
  return new Date().toISOString()
}

function completedCount(state: Pick<QuestLoopState, 'progressByQuest'>): number {
  return QUEST_CATALOG.reduce((count, quest) => count + (state.progressByQuest[quest.id]?.completed ? 1 : 0), 0)
}

/** Level is intentionally transparent: every 250 XP advances one level. */
export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.max(0, Number.isFinite(xp) ? xp : 0) / 250) + 1)
}

export function xpIntoLevel(xp: number): number {
  const safeXp = Math.max(0, Number.isFinite(xp) ? xp : 0)
  return safeXp % 250
}

export function nextLevelXp(xp: number): number {
  const safeXp = Math.max(0, Number.isFinite(xp) ? xp : 0)
  return (Math.floor(safeXp / 250) + 1) * 250
}

export function consistencyForCompletedCount(count: number): number {
  return Math.round(clamp(count, 0, QUEST_CATALOG.length) / QUEST_CATALOG.length * 100)
}

export function badgeIdsForState(state: Pick<QuestLoopState, 'progressByQuest' | 'streak'>): QuestBadgeId[] {
  const completed = completedCount(state)
  const unlocked: QuestBadgeId[] = []
  if (completed >= 1) unlocked.push('first-step')
  if (state.streak >= 3) unlocked.push('steady-rhythm')
  if (state.progressByQuest['buffer-first']?.completed) unlocked.push('buffer-builder')
  if (completed >= QUEST_CATALOG.length) unlocked.push('quest-keeper')
  return BADGE_ORDER.filter((badge) => unlocked.includes(badge))
}

export function questById(questId: QuestId): QuestDefinition {
  return QUEST_BY_ID[questId]
}

export function createQuestState(seed?: Partial<Pick<QuestLoopState, 'activeQuestId' | 'xp' | 'streak'>>): QuestLoopState {
  const progressByQuest = QUEST_CATALOG.reduce(
    (map, quest) => ({ ...map, [quest.id]: emptyProgress() }),
    {} as Record<QuestId, QuestProgress>,
  )
  const xp = Math.max(0, Number.isFinite(seed?.xp) ? seed!.xp! : 0)
  const streak = Math.max(0, Number.isFinite(seed?.streak) ? seed!.streak! : 0)
  const state: QuestLoopState = {
    activeQuestId: isQuestId(seed?.activeQuestId) ? seed!.activeQuestId! : null,
    progressByQuest,
    xp,
    streak,
    consistency: 0,
    level: levelForXp(xp),
    badges: [],
  }
  return { ...state, badges: badgeIdsForState(state) }
}

/** Fill missing records when a persisted state comes from an older prototype build. */
export function normalizeQuestState(input?: Partial<QuestLoopState> | null): QuestLoopState {
  const base = createQuestState({ activeQuestId: input?.activeQuestId ?? null, xp: input?.xp, streak: input?.streak })
  const progressByQuest = QUEST_CATALOG.reduce((map, quest) => {
    const source = input?.progressByQuest?.[quest.id]
    const current = clamp(source?.current ?? 0, 0, quest.target)
    const completed = Boolean(source?.completed && current >= quest.target)
    map[quest.id] = {
      current,
      started: Boolean(source?.started || completed),
      completed,
      selfReported: Boolean(source?.selfReported && completed),
      startedAt: typeof source?.startedAt === 'string' ? source.startedAt : null,
      completedAt: completed && typeof source?.completedAt === 'string' ? source.completedAt : null,
    }
    return map
  }, {} as Record<QuestId, QuestProgress>)
  const completed = completedCount({ progressByQuest })
  const state: QuestLoopState = {
    ...base,
    activeQuestId: input?.activeQuestId && Object.prototype.hasOwnProperty.call(QUEST_BY_ID, input.activeQuestId) ? input.activeQuestId : null,
    progressByQuest,
    consistency: consistencyForCompletedCount(completed),
    level: levelForXp(base.xp),
    badges: [],
  }
  return { ...state, badges: badgeIdsForState(state) }
}

/** Start (or switch to) exactly one quest. Existing progress is retained. */
export function startQuest(state: QuestLoopState, questId: QuestId, startedAt?: string | Date): QuestLoopState {
  const current = normalizeQuestState(state)
  if (!isQuestId(questId)) return current
  const progress = current.progressByQuest[questId]
  if (progress.completed) return { ...current, activeQuestId: questId }
  return {
    ...current,
    activeQuestId: questId,
    progressByQuest: {
      ...current.progressByQuest,
      [questId]: { ...progress, started: true, startedAt: progress.startedAt ?? toTimestamp(startedAt) },
    },
  }
}

/** Add a manually self-reported amount to the one active quest, capped at its target. */
export function recordQuestProgress(state: QuestLoopState, amount: number, questId = state.activeQuestId): QuestLoopState {
  const current = normalizeQuestState(state)
  if (!questId || !isQuestId(questId) || !current.activeQuestId || questId !== current.activeQuestId) return current
  const definition = QUEST_BY_ID[questId]
  const progress = current.progressByQuest[questId]
  if (progress.completed || !progress.started) return current
  const delta = Number.isFinite(amount) ? Math.max(0, amount) : 0
  const currentValue = clamp(progress.current + delta, 0, definition.target)
  return { ...current, progressByQuest: { ...current.progressByQuest, [questId]: { ...progress, current: currentValue } } }
}

export function canCompleteQuest(state: QuestLoopState, questId = state.activeQuestId): boolean {
  if (!questId || !isQuestId(questId) || questId !== state.activeQuestId) return false
  const progress = state.progressByQuest[questId]
  return Boolean(progress?.started && !progress.completed && progress.current >= QUEST_BY_ID[questId].target)
}

/** Explicitly mark a fully progressed quest complete; this awards XP once. */
export function completeQuest(state: QuestLoopState, questId = state.activeQuestId, completedAt?: string | Date): QuestLoopState {
  const current = normalizeQuestState(state)
  if (!canCompleteQuest(current, questId)) return current
  const definition = QUEST_BY_ID[questId!]
  const progress = current.progressByQuest[questId!]
  const progressByQuest = {
    ...current.progressByQuest,
    [questId!]: {
      ...progress,
      current: definition.target,
      completed: true,
      selfReported: true,
      completedAt: toTimestamp(completedAt),
    },
  }
  const nextXp = current.xp + definition.rewardXp
  const nextStreak = current.streak + 1
  const next: QuestLoopState = {
    ...current,
    progressByQuest,
    xp: nextXp,
    streak: nextStreak,
    consistency: consistencyForCompletedCount(completedCount({ progressByQuest })),
    level: levelForXp(nextXp),
    badges: [],
  }
  return { ...next, badges: badgeIdsForState(next) }
}

function spendingAmount(profile: FinancialProfile, key: string): number {
  return Math.max(0, profile.spending.find((item) => item.key === key)?.amount ?? 0)
}

/**
 * Rank quests from only the active profile. The score is a UI recommendation
 * signal, never a financial prediction or advice score.
 */
export function recommendQuests(profile: FinancialProfile, limit = QUEST_CATALOG.length): QuestRecommendation[] {
  const income = Math.max(1, profile.monthlyIncome)
  const spend = Math.max(0, profile.spending.reduce((sum, item) => sum + Math.max(0, item.amount), 0))
  const savingsRate = clamp((income - spend - Math.max(0, profile.currentMonthlyDebtObligations)) / income, 0, 1)
  const savingsMonths = profile.currentSavings / Math.max(1, spend)
  const transportShare = spendingAmount(profile, 'transport') / income
  const foodShare = spendingAmount(profile, 'food') / income
  const shoppingShare = spendingAmount(profile, 'shopping') / income

  const scored = QUEST_CATALOG.map((quest, index): QuestRecommendation => {
    let score = 1
    let reason = quest.recommendationHint
    if (quest.id === 'buffer-first') {
      score += savingsMonths < 3 ? 4 : 1
      score += savingsRate < .2 ? 2 : 0
      reason = savingsMonths < 3 ? 'مدخراتك الحالية تحتاج مساحة قبل التزام جديد.' : quest.recommendationHint
    } else if (quest.id === 'car-delay') {
      score += transportShare >= .12 ? 4 : 1
      score += profile.currentDebt > 0 ? 2 : 0
      reason = transportShare >= .12 ? 'النقل يأخذ حصة ملحوظة من دخلك؛ شهر إضافي يوضح المقايضة.' : quest.recommendationHint
    } else if (quest.id === 'cooling-off') {
      score += shoppingShare >= .08 ? 3 : 1
      reason = shoppingShare >= .08 ? 'بند التسوق بارز في مصروفك؛ مهلة قصيرة قد تكشف البدائل.' : quest.recommendationHint
    } else if (quest.id === 'home-meal') {
      score += foodShare >= .1 ? 3 : 1
      reason = foodShare >= .1 ? 'بند الطعام بارز في مصروفك؛ جرّبي خطوة قابلة للقياس.' : quest.recommendationHint
    }
    // Stable tie-breaking keeps a persisted selection from jumping around.
    return { ...quest, score: score + (QUEST_CATALOG.length - index) / 100, reason }
  })
  const count = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : QUEST_CATALOG.length
  return [...scored].sort((a, b) => b.score - a.score).slice(0, count)
}
