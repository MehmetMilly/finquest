import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  CircleDot,
  Home,
  LockKeyhole,
  PauseCircle,
  Route,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { FutureAvatar } from '../avatar/FutureAvatar'
import { Money } from '../components/Money'
import {
  QUEST_CATALOG,
  badgeIdsForState,
  canCompleteQuest,
  completeQuest,
  createQuestState,
  nextLevelXp,
  normalizeQuestState,
  questById,
  recordQuestProgress,
  recommendQuests,
  startQuest,
  type QuestDefinition,
  type QuestIconName,
  type QuestId,
  type QuestLoopState,
  type QuestModeledEffect,
  type QuestRecommendation,
} from '../domain/quests'
import { resolveQuestSelection } from '../domain/questRouting'
import type { FinancialProfile } from '../types/finance'
import '../styles/support.css'
import '../styles/quests.css'

export interface QuestsScreenProps {
  /** Existing one-quest API remains supported while the shared store is migrated. */
  onContinue?: () => void
  accepted?: boolean
  completed?: boolean
  onAccept?: () => void
  modeledEffect?: QuestModeledEffect
  /** Optional effects keyed by quest; `modeledEffect` is the legacy fallback. */
  modeledEffects?: Partial<Record<QuestId, QuestModeledEffect>>
  /** Pass the active profile to derive recommendation order from real inputs. */
  profile?: FinancialProfile
  recommendations?: readonly QuestRecommendation[]
  /** Canonical controlled/persisted state contract for the primary app. */
  questState?: QuestLoopState
  onQuestStateChange?: (state: QuestLoopState) => void
  /** Optional event hooks for analytics/toasts; state change remains the source of truth. */
  onSelectQuest?: (questId: QuestId) => void
  onStartQuest?: (questId: QuestId) => void
  onProgressQuest?: (questId: QuestId, amount: number) => void
  onCompleteQuest?: (questId: QuestId) => void
  /** Route intent from a specific CTA. Generic Tasks navigation leaves this null. */
  requestedQuestId?: QuestId | null
}

const formatNumber = new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 })
function QuestValue({ value, unit }: { value: number; unit: QuestDefinition['unit'] }) {
  return unit === 'ر.س'
    ? <Money value={value} />
    : <><bdi className="ltr-number">{formatNumber.format(Math.round(value))}</bdi> {unit}</>
}

const badgeCopy = {
  'first-step': { label: 'أول خطوة', body: 'سجّلت تغييراً قابلاً للملاحظة.' },
  'steady-rhythm': { label: 'إيقاع ثابت', body: 'اكتملت ثلاث مهام متتالية.' },
  'buffer-builder': { label: 'حماية أول مبلغ', body: 'تمت حماية أول مبلغ داخل النموذج.' },
  'quest-keeper': { label: 'حفظ العادات', body: 'اكتملت قائمة التجربة.' },
} as const

const iconForQuest = (name: QuestIconName, size = 18) => {
  if (name === 'shield') return <ShieldCheck size={size} aria-hidden="true" />
  if (name === 'route') return <Route size={size} aria-hidden="true" />
  if (name === 'pause') return <PauseCircle size={size} aria-hidden="true" />
  return <Home size={size} aria-hidden="true" />
}

function fallbackRecommendations(): QuestRecommendation[] {
  return QUEST_CATALOG.map((quest, index) => ({
    ...quest,
    score: QUEST_CATALOG.length - index,
    reason: quest.recommendationHint,
  }))
}

function initialLegacyState(accepted: boolean, completed: boolean): QuestLoopState {
  let state = createQuestState()
  if (!accepted && !completed) return state
  state = startQuest(state, 'buffer-first', 'prototype-start')
  if (!completed) return state
  state = recordQuestProgress(state, questById('buffer-first').target)
  return completeQuest(state, 'buffer-first', 'prototype-complete')
}

/* Quest styling lives in quests.css so the observatory surface can stay responsive and testable. */
export function QuestsScreen({
  onContinue,
  accepted = false,
  completed = false,
  onAccept,
  modeledEffect,
  modeledEffects,
  profile,
  recommendations,
  questState,
  onQuestStateChange,
  onSelectQuest,
  onStartQuest,
  onProgressQuest,
  onCompleteQuest,
  requestedQuestId,
}: QuestsScreenProps) {
  const [localState, setLocalState] = useState<QuestLoopState>(() => initialLegacyState(accepted, completed))
  const isControlled = questState !== undefined
  const currentState = isControlled ? normalizeQuestState(questState) : localState
  const suggested = useMemo(
    () => recommendations?.length ? [...recommendations] : profile ? recommendQuests(profile) : fallbackRecommendations(),
    [profile, recommendations],
  )
  const selectedInitial = resolveQuestSelection(requestedQuestId, currentState.activeQuestId, suggested.map((item) => item.id))
  const [selectedQuestId, setSelectedQuestId] = useState<QuestId>(selectedInitial)

  const selectedQuest = questById(selectedQuestId)
  const selectedRecommendation = suggested.find((item) => item.id === selectedQuestId)
  const selectedProgress = currentState.progressByQuest[selectedQuestId]
  const activeQuest = currentState.activeQuestId ? questById(currentState.activeQuestId) : null
  const selectedEffect = modeledEffects?.[selectedQuestId] ?? (selectedQuestId === 'buffer-first' ? modeledEffect : undefined)
  const progressPercent = Math.min(100, Math.round(selectedProgress.current / selectedQuest.target * 100))
  const activeSelected = currentState.activeQuestId === selectedQuestId
  const hasStarted = Boolean(selectedProgress.started)
  const canFinish = canCompleteQuest(currentState, selectedQuestId)
  const levelEnd = nextLevelXp(currentState.xp)
  const xpRemaining = Math.max(0, levelEnd - currentState.xp)
  const unlockedBadges = new Set(currentState.badges.length ? currentState.badges : badgeIdsForState(currentState))

  const applyState = (next: QuestLoopState) => {
    if (!isControlled) setLocalState(next)
    onQuestStateChange?.(next)
  }

  const selectQuest = (questId: QuestId) => {
    setSelectedQuestId(questId)
    onSelectQuest?.(questId)
  }

  const beginSelectedQuest = () => {
    const next = startQuest(currentState, selectedQuestId)
    applyState(next)
    onStartQuest?.(selectedQuestId)
    // Backward compatibility for the original car-buffer quest callback.
    if (selectedQuestId === 'buffer-first') onAccept?.()
  }

  const addProgress = () => {
    const next = recordQuestProgress(currentState, selectedQuest.step, selectedQuestId)
    applyState(next)
    onProgressQuest?.(selectedQuestId, selectedQuest.step)
  }

  const finishSelectedQuest = () => {
    const next = completeQuest(currentState, selectedQuestId)
    applyState(next)
    onCompleteQuest?.(selectedQuestId)
  }

  const effectDelta = selectedEffect?.delta ?? 0

  return (
    <main className={`support-screen quests-screen quest-loop ${currentState.activeQuestId ? 'quests-screen--accepted' : ''}`} dir="rtl" lang="ar">
      <header className="support-page-head quest-loop__head">
        <div className="quest-heading">
          <div className="quest-heading__meta"><span className="support-kicker">مهام صغيرة، أثر مفهوم</span><span className="quest-heading__system-label">مرصد 2036</span></div>
          <h1>اختر حركة واحدة <em>للمستقبل.</em></h1>
          <p className="quest-heading__lede">مسار واحد واضح اليوم، وإشارة أبعد قليلاً في خريطتك المالية.</p>
        </div>
        <section className="quest-scoreboard" aria-label="تقدمك في التجربة">
          <div className="quest-scoreboard__constellation" aria-hidden="true"><i /><i /><i /><i /></div>
          <span className="quest-scoreboard__item"><small>المستوى</small><strong><bdi className="ltr-number">{currentState.level}</bdi></strong><em><bdi className="ltr-number">{currentState.xp}</bdi> XP</em></span>
          <span className="quest-scoreboard__item"><small>السلسلة</small><strong><bdi className="ltr-number">{currentState.streak}</bdi></strong><em>مهمة متتالية</em></span>
          <span className="quest-scoreboard__item"><small>الاتساق</small><strong><bdi className="ltr-number">{currentState.consistency}</bdi>٪</strong><em>من القائمة</em></span>
          <span className="quest-scoreboard__item"><small>الخطوة التالية</small><strong><bdi className="ltr-number">{xpRemaining}</bdi></strong><em>XP للمستوى</em></span>
        </section>
      </header>

      <section className="quest-loop__grid" aria-label="اختيار المهمة">
        <aside className="quest-list" aria-label="قائمة المهام">
          <div className="quest-list__heading">
            <div><span className="quest-list__eyebrow">خريطة المسارات</span><h2>مساراتك</h2></div>
            <span className="quest-list__count"><bdi className="ltr-number">{suggested.length}</bdi> مهام قابلة للتجربة</span>
          </div>
          <div className="quest-list__items">
            {suggested.map((recommendation, index) => {
              const progress = currentState.progressByQuest[recommendation.id]
              const selected = selectedQuestId === recommendation.id
              const active = currentState.activeQuestId === recommendation.id
              return (
                <button
                  key={recommendation.id}
                  className={`quest-option ${selected ? 'is-selected' : ''} ${active ? 'is-active' : ''}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectQuest(recommendation.id)}
                >
                  <span className="quest-option__icon">{iconForQuest(recommendation.icon)}</span>
                  <span className="quest-option__copy"><strong>{recommendation.shortTitle}</strong><small>{recommendation.description}</small></span>
                  <span className="quest-option__meta"><b><bdi className="ltr-number">+{recommendation.rewardXp}</bdi></b> XP</span>
                  {(active || progress.completed) && <span className="quest-option__state">{progress.completed ? <><Check size={13} /> مكتملة ذاتياً</> : <><CircleDot size={12} /> نشطة الآن</>}</span>}
                  {!active && !progress.completed && index === 0 && <span className="quest-option__state"><Sparkles size={12} /> مقترحة لك</span>}
                </button>
              )
            })}
          </div>
          <p className="quest-list__note"><Sparkles size={15} aria-hidden="true" /><span>يمكنك اختيار أكثر من مسار، لكن التقدم يحدث في مهمة نشطة واحدة فقط. البدء بمسار آخر يحفظ ما سجلته هنا.</span></p>
        </aside>

        <section className="quest-panel" aria-labelledby="selected-quest-title">
          <AnimatePresence mode="wait">
            <motion.div key={selectedQuest.id} className="quest-panel__inner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .2 }}>
              <div className="quest-panel__eyebrow"><span><i aria-hidden="true" />{selectedQuest.category}</span><b><bdi className="ltr-number">{selectedQuest.rewardXp}</bdi> XP عند الإكمال</b></div>
              <h2 id="selected-quest-title">{selectedQuest.title}</h2>
              <p className="quest-panel__description">{selectedQuest.description} <span>{selectedRecommendation?.reason ?? selectedQuest.recommendationHint}</span></p>

              <div className="quest-progress" aria-label={`تقدم ${selectedQuest.shortTitle}`}>
                <div className="quest-progress__head"><small>{selectedProgress.completed ? 'اكتملت المهمة' : selectedProgress.started ? 'تقدم مسجل يدوياً' : 'لم تبدأ بعد'}</small><strong><QuestValue value={selectedProgress.current} unit={selectedQuest.unit} /> / <QuestValue value={selectedQuest.target} unit={selectedQuest.unit} /></strong></div>
                <div className="quest-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={selectedQuest.target} aria-valuenow={selectedProgress.current} aria-valuetext={`${progressPercent}%`} aria-label={`نسبة إنجاز ${selectedQuest.shortTitle}`}><i style={{ width: `${progressPercent}%` }} /></div>
                <p className="quest-progress__hint">{selectedQuest.prompt}</p>
              </div>

              {activeQuest && !activeSelected && <p className="quest-switch-note">مهمتك النشطة الآن: <b>{activeQuest.shortTitle}</b>. ابدأ هذا المسار لنقل التركيز إليه؛ سيبقى تقدم <b>{activeQuest.shortTitle}</b> محفوظاً.</p>}

              <div className="quest-panel__actions">
                {!hasStarted && <button className="support-primary" type="button" onClick={beginSelectedQuest}>ابدأ المهمة <ArrowLeft size={17} /></button>}
                {hasStarted && !selectedProgress.completed && <button className="support-primary" type="button" onClick={addProgress}>سجّلت <QuestValue value={selectedQuest.step} unit={selectedQuest.unit} /> <CircleDot size={17} /></button>}
                {hasStarted && !selectedProgress.completed && <button className="support-secondary" type="button" disabled={!canFinish} onClick={finishSelectedQuest}>{canFinish ? 'أعلن اكتمالها' : <>باقي <QuestValue value={Math.max(0, selectedQuest.target - selectedProgress.current)} unit={selectedQuest.unit} /></>} <Check size={16} /></button>}
                {selectedProgress.completed && <button className="support-secondary" type="button" onClick={onContinue}>شاهد أثرها في 2036 <ArrowLeft size={17} /></button>}
              </div>

              {selectedProgress.completed && <div className="quest-success" role="status"><span className="quest-success__stamp"><Check size={15} /> اكتملت بتأكيدك الذاتي</span><p>أضفنا <bdi className="ltr-number">{selectedQuest.rewardXp}</bdi> XP إلى رحلتك. لا يوجد تحويل مالي أو تحقق مصرفي في هذا النموذج.</p></div>}

              <div className="quest-avatar">
                <FutureAvatar mood={selectedProgress.completed ? 'celebrating' : hasStarted ? 'focused' : 'encouraging'} label="مرشد المستقبل" />
                <p>{selectedProgress.completed ? 'خطوة متواضعة، ومساحة أكبر للنَفَس.' : hasStarted ? 'كل تسجيل صغير يوضح العلاقة بين القرار وأثره.' : 'المستقبل لا يطلب الكمال، فقط موعداً جديداً.'}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </section>

      <section className="quest-loop__lower" aria-label="أثر المهمة والمكافآت">
        <article className="quest-effect">
          <div className="quest-effect__head"><div><span className="quest-card__eyebrow">محاكاة المسار</span><h3>الأثر المحاكى في مسارك</h3></div><span>قبل / بعد</span></div>
          {selectedEffect ? (
            <div className="quest-effect__values">
              <span className="quest-effect__value"><small>قبل المهمة</small><strong><Money value={selectedEffect.before} /></strong></span>
              <i aria-hidden="true" />
              <span className="quest-effect__value"><small>بعد المهمة</small><strong><Money value={selectedEffect.after} /></strong></span>
              <strong className="quest-effect__delta"><Money value={effectDelta} /></strong>
            </div>
          ) : (
            <div className="quest-effect__values"><span className="quest-effect__value"><small>قبل المهمة</small><strong>—</strong></span><i aria-hidden="true" /><span className="quest-effect__value"><small>بعد المهمة</small><strong>يرتبط بالمحاكاة</strong></span></div>
          )}
          <p className="quest-effect__note">هذا فرق نموذجي من الحسابات المعروضة، وليس وعداً بنتيجة أو نصيحة مالية. الأرقام لا تتحرك خارج هذه التجربة.</p>
        </article>
        <article className="quest-badges"><div className="quest-badges__head"><span className="quest-card__eyebrow">رصيد الرحلة</span><h3>شاراتك</h3></div><div className="quest-badges__list">{Object.entries(badgeCopy).map(([id, copy]) => { const unlocked = unlockedBadges.has(id as QuestLoopState['badges'][number]); return <span key={id} className={`quest-badge ${unlocked ? 'is-unlocked' : ''}`} title={copy.body}>{unlocked ? <Trophy size={13} /> : <LockKeyhole size={12} />}{copy.label}</span> })}</div></article>
      </section>

      <p className="quest-privacy"><LockKeyhole size={15} /><span><b>وضوح التجربة:</b> الإكمال هنا معلَّم ذاتياً لأغراض النموذج الأولي فقط؛ لا ننقل أموالاً، ولا نتحقق من سلوكك أو حسابك البنكي.</span></p>
      <p className="support-footnote">التقدم والمكافآت محليان وقابلان لإعادة الضبط. كل أثر مالي معروض مشتق من المحاكاة، وليس نصيحة مالية أو وعداً بعائد.</p>
    </main>
  )
}
