import { ArrowLeft, ArrowUpLeft, Check, Gauge, MessageCircleMore, PiggyBank, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FutureAvatar } from '../avatar/FutureAvatar'
import { Money } from '../components/Money'
import { FutureChat } from '../components/FutureChat'
import { ASSUMPTIONS } from '../data/assumptions'
import { formatSAR } from '../lib/formatters'
import type { ScenarioResult } from '../types/finance'
import '../styles/home.css'

export interface HomeScreenProps {
  /** Outputs of the simulation; the dashboard never invents financial figures. */
  results: ScenarioResult[]
  activeScenarioId?: ScenarioResult['id']
  displayName?: string
  /** Optional present-day savings rate (0–1). When absent, consistency from the active simulation is shown. */
  savingsRate?: number
  goalLabel?: string
  goalAmount?: number
  goalAmountIsIllustrative?: boolean
  questAccepted?: boolean
  /** Optional controlled state for opening the guide sheet from another app surface. */
  chatOpen?: boolean
  onTryDecision?: () => void
  onAcceptQuest?: (scenario: ScenarioResult) => void
  onChatOpenChange?: (isOpen: boolean) => void
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

function Numeric({ children }: { children: React.ReactNode }) {
  return <bdi className="home-numeric ltr-number" dir="ltr">{children}</bdi>
}

export function HomeScreen({
  results,
  activeScenarioId,
  displayName = 'نسختك',
  savingsRate,
  goalLabel,
  goalAmount,
  questAccepted = false,
  chatOpen: controlledChatOpen,
  onTryDecision,
  onAcceptQuest,
  onChatOpenChange,
}: HomeScreenProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const active = useMemo(
    () => results.find((scenario) => scenario.id === activeScenarioId) ?? results.find((scenario) => scenario.id === 'delay') ?? results[0],
    [activeScenarioId, results],
  )

  if (!active) {
    return <section className="home-screen home-screen--empty" dir="rtl"><p>لا توجد محاكاة جاهزة للعرض بعد.</p></section>
  }

  const rate = clampPercent((savingsRate ?? active.investmentConsistency) * 100)
  const monthlyCommitments = active.payment + (active.balloonPayment ?? 0) / Math.max(active.paymentMonths, 1)
  const healthRing = clampPercent(active.healthScore)
  const reserveMonths = Math.max(0, active.emergencyFundMonths)
  const reserveSteps = Math.min(ASSUMPTIONS.emergencyFundTargetMonths, Math.round(reserveMonths))
  const healthLabel = healthRing >= 75 ? 'مسار قوي' : healthRing >= 55 ? 'مسار متوازن' : 'يحتاج مساحة'
  const savingsGauge = Math.max(8, Math.min(100, rate))
  const flexibilityGauge = Math.max(8, Math.min(100, Math.abs(active.monthlyFlexibility) / Math.max(monthlyCommitments, 1) * 100))
  const commitmentsGauge = Math.max(8, Math.min(100, monthlyCommitments / Math.max(active.monthlyFlexibility + monthlyCommitments, 1) * 100))
  const isChatOpen = controlledChatOpen ?? chatOpen
  const openChat = () => {
    if (controlledChatOpen === undefined) setChatOpen(true)
    onChatOpenChange?.(true)
  }
  const closeChat = () => {
    if (controlledChatOpen === undefined) setChatOpen(false)
    onChatOpenChange?.(false)
  }

  return (
    <main className="home-screen" dir="rtl">
      <div className="home-screen__ambient" aria-hidden="true" />
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <h1 id="home-title"><span className="home-title__hello">يا هلا <bdi>{displayName}</bdi></span><span className="home-title__impact">لقرارك <em>أثر</em></span></h1>
          <p className="home-hero__message">
            {questAccepted
              ? 'بدأت مهمة حماية أول مبلغ داخل التجربة. سجّل التقدم بنفسك، وبعدها نشوف أثرها المحسوب.'
              : 'جرّب القرار قبل ما تلتزم، وشوف وش يترك لميزانيتك وأهدافك.'}
          </p>
          {goalLabel && goalAmount !== undefined && (
            <div className="home-active-goal" aria-label={`هدفك: ${goalLabel}، ${formatSAR(goalAmount)}`}>
              <span className="home-active-goal__title">هدفك</span>
              <span className="home-active-goal__details">
                <strong><bdi>{goalLabel}</bdi></strong>
                <Money value={goalAmount} />
              </span>
            </div>
          )}
          <div className="home-hero__actions">
            <button className="home-button home-button--primary" onClick={onTryDecision}>
              جرّب قرارك <ArrowLeft size={18} />
            </button>
            <button className="home-button home-button--chat" onClick={openChat}>
              <MessageCircleMore size={17} /> اسأل ذاتي
            </button>
          </div>
        </div>

        <div className="home-avatar-zone">
          <div className="home-orbit home-orbit--outer" aria-hidden="true" />
          <div className="home-orbit home-orbit--inner" aria-hidden="true" />
          <div className="home-avatar-zone__caption"><Sparkles size={13} /> ذاتي · 2036</div>
          <FutureAvatar className="home-avatar" mood={questAccepted ? 'celebrating' : 'encouraging'} />
          <div className="home-health-ring" style={{ '--home-score': `${healthRing * 3.6}deg` } as React.CSSProperties} aria-label={`مؤشر المسار ${healthRing} من 100، ${healthLabel}`}>
            <div className="home-health-ring__core">
              <div className="home-health-ring__value"><Numeric>{healthRing}</Numeric><small>/100</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-metrics" aria-label="ملخص وضعك المالي">
        <article className="home-metric home-metric--savings" style={{ '--metric-fill': `${savingsGauge}%` } as React.CSSProperties}>
          <div className="home-metric__heading"><span>معدل الادخار</span><i className="home-metric__icon"><PiggyBank size={20} aria-hidden="true" /></i></div>
          <div className="home-metric__value"><Numeric>{rate}%</Numeric><small>{savingsRate === undefined ? 'من انتظام الاستثمار' : 'من دخلك الشهري'}</small></div>
          <div className="home-metric__gauge" aria-hidden="true"><i /></div>
        </article>
        <article className={`home-metric home-metric--flexibility${active.monthlyFlexibility < 0 ? ' is-negative' : ''}`} style={{ '--metric-fill': `${flexibilityGauge}%` } as React.CSSProperties}>
          <div className="home-metric__heading"><span>مساحة الشهر</span><i className="home-metric__icon"><Gauge size={20} aria-hidden="true" /></i></div>
          <div className="home-metric__value"><Money value={active.monthlyFlexibility} compact /><small>بعد الالتزامات</small></div>
          <div className="home-metric__gauge" aria-hidden="true"><i /></div>
        </article>
        <article className="home-metric home-metric--commitments" style={{ '--metric-fill': `${commitmentsGauge}%` } as React.CSSProperties}>
          <div className="home-metric__heading"><span>الالتزامات</span><i className="home-metric__icon"><ReceiptText size={20} aria-hidden="true" /></i></div>
          <div className="home-metric__value"><Money value={monthlyCommitments} compact /><small>شهريًا في المسار</small></div>
          <div className="home-metric__gauge" aria-hidden="true"><i /></div>
        </article>
        <article className="home-metric home-metric--reserve">
          <div className="home-metric__heading"><span>صندوق الطوارئ</span><ShieldCheck size={16} aria-hidden="true" /></div>
          <div className="home-reserve__summary">
            <Numeric>{reserveMonths.toLocaleString('en', { maximumFractionDigits: 1 })}</Numeric>
            <span>من {ASSUMPTIONS.emergencyFundTargetMonths} أشهر</span>
          </div>
          <div className="home-reserve__track" aria-label={`${reserveSteps} من ${ASSUMPTIONS.emergencyFundTargetMonths} أشهر محمية`}>
            {Array.from({ length: ASSUMPTIONS.emergencyFundTargetMonths }, (_, index) => <i key={index} className={index < reserveSteps ? 'is-filled' : ''} />)}
          </div>
          <small>{reserveSteps === 0 ? 'ابدأ بحماية أول شهر' : `${ASSUMPTIONS.emergencyFundTargetMonths - reserveSteps} أشهر للوصول للهدف`}</small>
        </article>
      </section>

      <section className={questAccepted ? 'home-quest home-quest--accepted' : 'home-quest'} aria-label="تحدي الشهر">
        <div className="home-quest__mark">{questAccepted ? <Check size={17} /> : <Sparkles size={17} />}</div>
        <div className="home-quest__copy">
          <span>تحدّي الشهر</span>
          <h2>{questAccepted ? 'خطوة الغد محمية' : 'وسّع مساحة الغد'}</h2>
          <p>{questAccepted ? 'المهمة بدأت، والتقدم ما يتغير إلا بما تسجله أنت داخل النموذج.' : <>احمِ أول <Money value={1_500} /> قبل ما تحسم قرار الترقية.</>}</p>
        </div>
        <div className="home-quest__impact">
          <span>{questAccepted ? 'المسار المختار' : 'أفضل صحة مالية'}</span>
          <Numeric>{active.healthScore}&nbsp;/&nbsp;100</Numeric>
        </div>
        {!questAccepted && (
          <button className="home-quest__action" onClick={() => onAcceptQuest?.(active)}>
            ابدأ التحدّي <ArrowUpLeft size={17} />
          </button>
        )}
      </section>

      <FutureChat results={results} activeScenarioId={active.id} open={isChatOpen} onClose={closeChat} />
    </main>
  )
}
