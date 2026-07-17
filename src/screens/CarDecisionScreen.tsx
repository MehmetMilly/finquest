import { ArrowRight, BadgeCheck, ChevronLeft, CircleAlert, Gauge, Sparkles, WalletCards } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { FutureAvatar, type AvatarMood } from '../avatar/FutureAvatar'
import { Money } from '../components/Money'
import { deriveMonthlyInstallment } from '../domain/financing'
import { ASSUMPTIONS } from '../data/assumptions'
import { commitNumericDraft } from './carDecisionNumeric'
import '../styles/decisions.css'

export interface CarDecisionInput {
  price: number
  deposit: number
  years: number
  finalPayment: number
  monthlyInstallment: number
}

export interface CarDecisionScreenProps {
  onBack?: () => void
  onSimulate?: (decision: CarDecisionInput) => void
  initialDecision?: CarDecisionInput
  monthlyIncome?: number
}

const formatter = new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 })
const clampNumber = (value: number, min: number, max: number) => commitNumericDraft(String(value), { min, max }, min)

interface InitialCarValues {
  price: number
  deposit: number
  years: number
  finalPayment: number
}

function normalizeInitialValues(initialDecision?: CarDecisionInput): InitialCarValues {
  const price = clampNumber(initialDecision?.price ?? 160_000, 60_000, 400_000)
  const deposit = clampNumber(initialDecision?.deposit ?? 10_000, 0, Math.max(0, price - 1_000))
  const principal = Math.max(1_000, price - deposit)
  const finalPayment = clampNumber(initialDecision?.finalPayment ?? 25_000, 0, Math.max(0, principal - 1_000))
  const candidateYears = initialDecision?.years ?? 5
  const years = [3, 4, 5, 6, 7].includes(candidateYears) ? candidateYears : 5

  return { price, deposit, years, finalPayment }
}

export function CarDecisionScreen({ onBack, onSimulate, initialDecision, monthlyIncome = 7_000 }: CarDecisionScreenProps) {
  const initialValues = useMemo(() => normalizeInitialValues(initialDecision), [initialDecision])
  const [price, setPrice] = useState(initialValues.price)
  const [deposit, setDeposit] = useState(initialValues.deposit)
  const [years, setYears] = useState(initialValues.years)
  const [finalPayment, setFinalPayment] = useState(initialValues.finalPayment)
  const [inputSyncKey, setInputSyncKey] = useState(0)

  const safeDeposit = Math.min(deposit, Math.max(0, price - 1_000))
  const principal = Math.max(1_000, price - safeDeposit)
  const safeFinalPayment = Math.min(finalPayment, Math.max(0, principal - 1_000))
  const depositMax = Math.max(0, price - 1_000)
  const finalPaymentMax = Math.max(0, principal - 1_000)
  const paymentMonths = years * 12
  const monthlyInstallment = useMemo(() => deriveMonthlyInstallment({
    principal,
    balloonPayment: safeFinalPayment,
    paymentMonths,
    annualEffectiveRate: ASSUMPTIONS.illustrativeFinancingRate,
  }), [principal, safeFinalPayment, paymentMonths])
  const fullCommitment = monthlyInstallment + safeFinalPayment / paymentMonths
  const totalPaid = safeDeposit + (monthlyInstallment * paymentMonths) + safeFinalPayment
  const financingCost = totalPaid - price
  const nextPrincipal = Math.max(1_000, price - Math.min(price - 1_000, safeDeposit + 10_000))
  const nextFinalPayment = Math.min(safeFinalPayment, Math.max(0, nextPrincipal - 1_000))
  const higherDepositInstallment = deriveMonthlyInstallment({
    principal: nextPrincipal,
    balloonPayment: nextFinalPayment,
    paymentMonths,
    annualEffectiveRate: ASSUMPTIONS.illustrativeFinancingRate,
  })
  const higherDepositSaving = Math.max(0, monthlyInstallment - higherDepositInstallment)
  const pressure = fullCommitment / Math.max(monthlyIncome, 1)
  const avatarMood: AvatarMood = pressure > 0.35 ? 'worried' : pressure > 0.27 ? 'thinking' : 'encouraging'
  const avatarLabel = pressure > 0.35
    ? 'خلّينا نخفف الالتزام الشهري.'
    : pressure > 0.27
      ? 'الدفعة الأولى تمنحك مساحة أكبر.'
      : 'هذا المسار يحافظ على مرونتك.'

  const decision: CarDecisionInput = {
    price,
    deposit: safeDeposit,
    years,
    finalPayment: safeFinalPayment,
    monthlyInstallment,
  }

  const commitPrice = (next: number) => {
    const nextPrice = clampNumber(next, 60_000, 400_000)
    const nextDeposit = Math.min(safeDeposit, Math.max(0, nextPrice - 1_000))
    const nextPrincipal = Math.max(1_000, nextPrice - nextDeposit)
    const nextFinalPayment = Math.min(safeFinalPayment, Math.max(0, nextPrincipal - 1_000))
    setPrice(nextPrice)
    setDeposit(nextDeposit)
    setFinalPayment(nextFinalPayment)
    setInputSyncKey((current) => current + 1)
  }

  const commitDeposit = (next: number) => {
    const nextDeposit = clampNumber(next, 0, depositMax)
    const nextPrincipal = Math.max(1_000, price - nextDeposit)
    const nextFinalPayment = Math.min(safeFinalPayment, Math.max(0, nextPrincipal - 1_000))
    setDeposit(nextDeposit)
    setFinalPayment(nextFinalPayment)
    setInputSyncKey((current) => current + 1)
  }

  const commitFinalPayment = (next: number) => {
    setFinalPayment(clampNumber(next, 0, finalPaymentMax))
    setInputSyncKey((current) => current + 1)
  }

  const commitYears = (next: number) => {
    setYears(next)
    setInputSyncKey((current) => current + 1)
  }

  return (
    <main className="car-screen" dir="rtl">
      <header className="car-screen__header">
        <button type="button" className="decisions-back" onClick={onBack} disabled={!onBack}>
          <ArrowRight size={18} aria-hidden="true" />
          رجوع للقرارات
        </button>
        <div className="car-screen__progress" aria-label="الخطوة الأولى من القرار">
          <span>1 من 2</span><i><b /></i><small>تحديد العرض</small>
        </div>
      </header>

      <div className="car-screen__layout">
        <section className="car-builder" aria-labelledby="car-title">
          <span className="screen-kicker">قرار شراء سيارة</span>
          <h1 id="car-title">كم مساحة تبغى تتركها <em>بعد الشراء؟</em></h1>
          <p className="car-builder__lead">عدّل العرض مثل ما وصلك. بنحسب القسط ونوضح وش يتركه القرار في ميزانيتك الشهرية.</p>

          <div className="offer-card">
            <div className="offer-card__top"><span>عرض تمويل تقديري</span><span className="offer-card__dot">يُحدَّث الآن</span></div>
            <div className="offer-card__payment">
              <span>القسط الشهري</span>
              <strong><Money value={monthlyInstallment} /></strong>
              <small>لمدة {formatter.format(years)} سنوات · مرجع تكلفة تمويل تعليمي 6.2٪</small>
            </div>
            <div className="offer-card__terms">
              <span><small>الدفعة الأولى</small><b><Money value={safeDeposit} /></b></span>
              <span><small>الدفعة الأخيرة</small><b><Money value={safeFinalPayment} /></b></span>
              <span><small>إجمالي الالتزام</small><b><Money value={totalPaid} /></b></span>
            </div>
          </div>

          <form className="car-fields" onSubmit={(event) => { event.preventDefault(); onSimulate?.(decision) }}>
            <MoneyField
              id="car-price"
              label="سعر السيارة"
              hint="السعر قبل التمويل"
              value={price}
              min={60_000}
              max={400_000}
              step={5_000}
              syncKey={inputSyncKey}
              onValueChange={commitPrice}
            />
            <MoneyField
              id="car-deposit"
              label="الدفعة الأولى"
              hint="كل زيادة تخفف القسط"
              value={safeDeposit}
              min={0}
              max={depositMax}
              step={5_000}
              syncKey={inputSyncKey}
              onValueChange={commitDeposit}
            />
            <label className="car-field" htmlFor="car-years">
              <span className="car-field__label"><b>مدة التمويل</b><small>وقت أطول يعني قسطاً أخف وتكلفة أعلى</small></span>
              <select id="car-years" value={years} onChange={(event) => commitYears(Number(event.target.value))}>
                {[3, 4, 5, 6, 7].map((year) => <option value={year} key={year}>{formatter.format(year)} سنوات</option>)}
              </select>
            </label>
            <MoneyField
              id="car-final"
              label="الدفعة الأخيرة"
              hint="مبلغ يبقى لنهاية العقد"
              value={safeFinalPayment}
              min={0}
              max={finalPaymentMax}
              step={5_000}
              syncKey={inputSyncKey}
              onValueChange={commitFinalPayment}
            />
          </form>

          <div className="car-insight" role="status" aria-live="polite">
            <CircleAlert size={18} aria-hidden="true" />
            <p>مع تخصيص جزء للدفعة الأخيرة، يصبح الالتزام الفعلي <b><Money value={fullCommitment} /></b> شهرياً.</p>
          </div>
        </section>

        <aside className="future-panel" aria-label="رأي نسختك المستقبلية">
          <div className="future-panel__eyebrow"><Sparkles size={16} aria-hidden="true" /> <span>من نسختك في 2036</span></div>
          <div className="future-panel__avatar">
            <FutureAvatar mood={avatarMood} size="lg" label="نسختك المستقبلية في 2036" />
          </div>
          <p className="future-panel__message" aria-live="polite">{avatarLabel}</p>
          <div className="future-pulse" aria-label={`الالتزام يستهلك ${Math.round(pressure * 100)} بالمئة من مساحة المثال الشهرية`}>
            <span>ضغط الالتزام</span><i><b style={{ width: `${Math.min(100, Math.max(8, pressure * 100))}%` }} /></i><strong>{formatter.format(Math.round(pressure * 100))}٪</strong>
          </div>
          <small className="future-panel__footnote">مبني على دخل الملف النشط للتوضيح، وليس توصية ائتمانية.</small>
        </aside>
      </div>

      <section className="path-preview" aria-labelledby="paths-title">
        <div className="path-preview__heading">
          <span className="screen-kicker">لمحة عن المسارات</span>
          <h2 id="paths-title">ليس هناك مسار واحد صحيح.</h2>
        </div>
        <div className="path-preview__cards">
          <PathCard icon={<WalletCards size={19} />} title="أقسط الآن" detail={<>قسط <Money value={monthlyInstallment} /></>} tone="warm" />
          <PathCard icon={<Gauge size={19} />} title="أرفع الدفعة" detail={<>كل <Money value={10_000} /> تخفف تقريباً <Money value={higherDepositSaving} /> من القسط</>} tone="calm" />
          <PathCard icon={<BadgeCheck size={19} />} title="أنتظر سنة" detail="ابنِ الدفعة واحتفظ بهامش أوسع" tone="bright" />
        </div>
      </section>

      <footer className="car-screen__action">
        <div><span>تكلفة التمويل التقديرية</span><b><Money value={financingCost} /></b></div>
        <button type="button" className="decision-primary" onClick={() => onSimulate?.(decision)}>
          شوف أثر القرار <ChevronLeft size={19} aria-hidden="true" />
        </button>
      </footer>
    </main>
  )
}

interface MoneyFieldProps {
  id: string
  label: string
  hint: string
  value: number
  min: number
  max: number
  step: number
  syncKey: number
  onValueChange: (value: number) => void
}

function MoneyField({ id, label, hint, value, min, max, step, syncKey, onValueChange }: MoneyFieldProps) {
  const [draftState, setDraftState] = useState(() => ({ syncKey, draft: String(value) }))
  const draft = draftState.syncKey === syncKey ? draftState.draft : String(value)

  const commitDraft = () => {
    const next = commitNumericDraft(draft, { min, max }, value)
    setDraftState({ syncKey, draft: String(next) })
    onValueChange(next)
  }

  return (
    <label className="car-field" htmlFor={id}>
      <span className="car-field__label"><b>{label}</b><small>{hint}</small></span>
      <span className="car-field__control">
        <input id={id} type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(event) => onValueChange(Number(event.target.value))} />
        <span className="car-field__number"><input aria-label={label} type="number" inputMode="numeric" min={min} max={max} step={step} value={draft} onChange={(event) => setDraftState({ syncKey, draft: event.target.value })} onBlur={commitDraft} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commitDraft() } }} /><em>ر.س</em></span>
      </span>
    </label>
  )
}

function PathCard({ icon, title, detail, tone }: { icon: ReactNode; title: string; detail: ReactNode; tone: 'warm' | 'calm' | 'bright' }) {
  return <article className={`path-card path-card--${tone}`}><span className="path-card__icon">{icon}</span><div><h3>{title}</h3><p>{detail}</p></div></article>
}
