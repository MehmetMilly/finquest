import {
  ArrowUpLeft,
  Database,
  Gauge,
  PiggyBank,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useMemo, type CSSProperties } from 'react'
import { Money } from '../components/Money'
import { ASSUMPTIONS, MODEL_DISCLOSURES } from '../data/assumptions'
import { primaryProfile } from '../data/mockProfiles'
import type { FinancialProfile } from '../types/finance'
import '../styles/account.css'

export interface AccountScreenProps {
  onResetDemo: () => void
  profile?: FinancialProfile
  profileSource?: 'personal' | 'sara' | null
}

function Rate({ value }: { value: number }) {
  return <span className="account-rate"><bdi dir="ltr" className="ltr-number">{(value * 100).toFixed(1)}</bdi>٪</span>
}

function AccountScreen({ onResetDemo, profile = primaryProfile, profileSource }: AccountScreenProps) {
  const totalSpend = useMemo(() => profile.spending.reduce((sum, item) => sum + item.amount, 0), [profile])
  const availableBeforeSavings = profile.monthlyIncome - totalSpend - profile.currentMonthlyDebtObligations
  const isDemo = profileSource === 'sara' || (profileSource === undefined && profile.id === primaryProfile.id)
  const avatarInitial = Array.from(profile.firstName.trim())[0] ?? 'ف'
  const goalAmount = profile.goalAmount ?? ASSUMPTIONS.homeDepositGoal
  const goalProgress = goalAmount > 0 ? Math.min(100, Math.max(0, Math.round((profile.currentSavings / goalAmount) * 100))) : 0
  const goalSourceNote = profile.goalAmountSource === 'illustrative'
    ? 'مبلغ توضيحي لأن الحقل تُرك فارغًا'
    : isDemo
      ? 'هدف اصطناعي للتجربة'
      : 'من إدخالك المحلي'
  const profileContext = isDemo && profile.age !== undefined && profile.city
    ? `${profile.age} سنة · ${profile.city}`
    : 'نسختك بعد 10 سنوات'
  const sourceMessage = isDemo ? 'قيم ملف سارة اصطناعية ومخصصة للعرض.' : 'القيم الأساسية هنا أدخلتها محليًا وهي تقريبية.'
  const meterStyle = { '--goal-progress': `${goalProgress}%` } as CSSProperties

  return (
    <main className="account-screen account-observatory" dir="rtl" lang="ar">
      <div className="account-observatory__rings" aria-hidden="true" />

      <header className="account-head">
        <div className="account-head__copy">
          <div className="account-eyebrow"><span className="account-eyebrow__line" aria-hidden="true" /><span>حسابي</span><bdi dir="ltr">LOCAL / 01</bdi></div>
          <h1>ملفك المالي، <span>واضح أمامك.</span></h1>
          <p>لوحة هادئة تجمع هويتك، هدفك، والأرقام التي تحرّك محاكاة FinQuest.</p>
        </div>
        <div className="account-head__status" aria-label="حالة الملف">
          <span className="account-status"><i aria-hidden="true" />{isDemo ? 'وضع العرض' : 'ملف محلي نشط'}</span>
          <span className="account-status__rtl">العربية · RTL</span>
        </div>
      </header>

      <section className="account-hero" aria-labelledby="account-hero-title">
        <article className="account-identity">
          <div className="account-identity__top">
            <div className="account-avatar" aria-hidden="true">
              <UserRound size={26} strokeWidth={1.65} />
              <i>{avatarInitial}</i>
            </div>
            <div>
              <span className="account-identity__chip">{isDemo ? 'ملف سارة التجريبي الاصطناعي' : 'ملفك الشخصي المحلي'}</span>
              <h2 id="account-hero-title">أهلًا، <bdi>{profile.firstName}</bdi></h2>
              <p className="account-identity__context">{profileContext}</p>
              <p className="account-identity__full-name">{profile.name}</p>
            </div>
          </div>

          <div className="account-identity__signal">
            <span className="account-label">البوصلة الحالية</span>
            <p>{profile.personaNote}</p>
          </div>

          <dl className="account-identity__facts">
            <div><dt>العمل</dt><dd>{profile.occupation}</dd></div>
            <div><dt>النمط المالي</dt><dd>{profile.persona}</dd></div>
            <div><dt>استثمار شهري</dt><dd><Money value={profile.monthlyInvestment} /></dd></div>
          </dl>

          <p className="account-identity__note"><ShieldCheck size={15} aria-hidden="true" /> يُحفظ هذا الملف على جهازك داخل النموذج، ولا يمثل حساباً مصرفياً أو بيانات عميل.</p>
        </article>

        <article className="account-goal" aria-labelledby="account-goal-title">
          <div className="account-goal__backdrop" aria-hidden="true" />
          <div className="account-goal__header">
            <span className="account-goal__eyebrow"><Target size={15} aria-hidden="true" /> الوجهة في الأفق</span>
            <span className="account-goal__horizon"><bdi dir="ltr" className="ltr-number">{ASSUMPTIONS.startYear}</bdi> — <bdi dir="ltr" className="ltr-number">{ASSUMPTIONS.startYear + ASSUMPTIONS.years}</bdi></span>
          </div>
          <div className="account-goal__content">
            <div className="account-goal__meter" style={meterStyle} aria-label={`المقارنة الحالية تعادل ${goalProgress}% من الهدف`}>
              <div className="account-goal__meter-core">
                <span>هدف النموذج</span>
                <Money value={goalAmount} className="account-goal__amount" />
              </div>
            </div>
            <div className="account-goal__copy">
              <span className="account-label account-label--light">الهدف الذي اخترته</span>
              <h2 id="account-goal-title"><bdi>{profile.goal}</bdi></h2>
              <p>المحاكاة تقيس هذا الهدف عبر الزمن قبل أن تقارن أي قرار كبير.</p>
              <div className="account-goal__reading">
                <span><PiggyBank size={15} aria-hidden="true" /> المدخرات الحالية</span>
                <strong><Money value={profile.currentSavings} /></strong>
                <span className="account-goal__progress"><bdi dir="ltr" className="ltr-number">{goalProgress}%</bdi> من المقارنة الحالية</span>
              </div>
            </div>
          </div>
          <p className="account-goal__source"><Sparkles size={14} aria-hidden="true" /> {goalSourceNote}</p>
        </article>
      </section>

      <section className="account-summary-block" aria-labelledby="account-summary-title">
        <header className="account-section-head">
          <div><span className="account-eyebrow account-eyebrow--small"><span className="account-eyebrow__line" aria-hidden="true" /> قراءة سريعة</span><h2 id="account-summary-title">إشاراتك الآن</h2></div>
          <span className="account-section-head__meta">من الملف الحالي</span>
        </header>

        <ul className="account-metrics">
          <li className="account-metric account-metric--income">
            <div className="account-metric__top"><span className="account-metric__icon" aria-hidden="true"><Wallet size={18} /></span><span>الدخل الشهري</span></div>
            <strong><Money value={profile.monthlyIncome} /></strong>
            <p>{isDemo ? 'قيمة تجريبية' : 'من إدخالك المحلي'}</p>
          </li>
          <li className="account-metric account-metric--spend">
            <div className="account-metric__top"><span className="account-metric__icon" aria-hidden="true"><Receipt size={18} /></span><span>الإنفاق في النموذج</span></div>
            <strong><Money value={totalSpend} /></strong>
            <p>مجموع الفئات الشهرية</p>
          </li>
          <li className={`account-metric account-metric--available${availableBeforeSavings < 0 ? ' is-negative' : ''}`}>
            <div className="account-metric__top"><span className="account-metric__icon" aria-hidden="true"><Gauge size={18} /></span><span>المتاح قبل الادخار</span></div>
            <strong><Money value={availableBeforeSavings} /></strong>
            <p>{profile.currentMonthlyDebtObligations > 0 ? 'بعد الإنفاق والالتزامات' : 'بعد الإنفاق الشهري'}</p>
          </li>
          <li className="account-metric account-metric--savings">
            <div className="account-metric__top"><span className="account-metric__icon" aria-hidden="true"><PiggyBank size={18} /></span><span>المدخرات الحالية</span></div>
            <strong><Money value={profile.currentSavings} /></strong>
            <p>ليست رصيداً مصرفياً متصلًا</p>
          </li>
        </ul>
      </section>

      <section className="account-ledger" aria-labelledby="account-ledger-title">
        <header className="account-section-head account-section-head--ledger">
          <div><span className="account-eyebrow account-eyebrow--small"><span className="account-eyebrow__line" aria-hidden="true" /> من داخل النموذج</span><h2 id="account-ledger-title">دفتر الافتراضات</h2></div>
          <span className="account-ledger__seal"><span aria-hidden="true" /> حتمي · {ASSUMPTIONS.years} سنوات</span>
        </header>
        <p className="account-ledger__intro">هذه مدخلات المحاكاة المشتركة، وليست وعوداً أو توقعات شخصية.</p>
        <dl className="account-ledger__grid">
          <div><dt>الأفق الزمني</dt><dd><bdi dir="ltr" className="ltr-number">{ASSUMPTIONS.years}</bdi> سنوات</dd><small>من <bdi dir="ltr" className="ltr-number">{ASSUMPTIONS.startYear}</bdi></small></div>
          <div><dt>نمو الدخل السنوي</dt><dd><Rate value={ASSUMPTIONS.annualSalaryGrowth} /></dd><small>افتراض تعليمي</small></div>
          <div><dt>عائد استثماري افتراضي</dt><dd><Rate value={ASSUMPTIONS.annualInvestmentReturn} /></dd><small>ليس ضماناً</small></div>
          <div><dt>تضخم تكاليف المعيشة</dt><dd><Rate value={ASSUMPTIONS.annualInflation} /></dd><small>يؤثر في القوة الشرائية</small></div>
          <div><dt>عائد الادخار النقدي</dt><dd><Rate value={ASSUMPTIONS.annualSavingsReturn} /></dd><small>داخل النموذج فقط</small></div>
          <div><dt>{MODEL_DISCLOSURES.existingDebt.title}</dt><dd><bdi dir="ltr" className="ltr-number">{ASSUMPTIONS.existingDebtApproximationMonths}</bdi> شهراً</dd><small>تقريب على القسط الشهري</small></div>
        </dl>
      </section>

      <aside className="account-local-note" aria-labelledby="account-local-note-title">
        <span className="account-local-note__icon" aria-hidden="true"><Database size={19} /></span>
        <div><span className="account-label">شفافية البيانات</span><h2 id="account-local-note-title">بياناتك تبقى على جهازك</h2><p>{sourceMessage} لا يوجد هنا اتصال مصرفي أو إرسال تلقائي؛ تُستخدم القيم لبناء هذه التجربة التعليمية فقط.</p></div>
        <span className="account-local-note__badge"><ShieldCheck size={14} aria-hidden="true" /> محلي فقط</span>
      </aside>

      <aside className="account-disclaimer-v2" role="note" aria-labelledby="account-disclaimer-title">
        <span className="account-disclaimer-v2__mark" aria-hidden="true">!</span>
        <div><h2 id="account-disclaimer-title">تنبيه مهم</h2><p>{sourceMessage} نتائج المحاكاة محسوبة وتوضيحية؛ المحتوى للتثقيف ولا يشكّل نصيحة مالية أو استثمارية أو ائتمانية، ولا يضمن نتيجة مستقبلية.</p><p>{MODEL_DISCLOSURES.existingDebt.detail}</p></div>
      </aside>

      <footer className="account-reset">
        <div><span>إجراء متقدم</span><strong>مسح بيانات التجربة</strong><p id="account-reset-description">يعود FinQuest إلى شاشة البداية ويزيل الملف المحلي.</p></div>
        <button type="button" className="account-reset__button" onClick={onResetDemo} aria-label="ابدأ من جديد ومسح بيانات التجربة" aria-describedby="account-reset-description"><RotateCcw size={16} aria-hidden="true" /> ابدأ من جديد <ArrowUpLeft size={14} aria-hidden="true" /></button>
      </footer>
    </main>
  )
}

export { AccountScreen }
