import { ArrowRight, ArrowUpLeft, BadgeCheck, CarFront, Compass } from 'lucide-react'
import '../styles/decisions.css'

export interface DecisionsScreenProps {
  onBack?: () => void
  onSelectCar?: () => void
}

export function DecisionsScreen({ onBack, onSelectCar }: DecisionsScreenProps) {
  return (
    <main className="decisions-screen" dir="rtl">
      <header className="decisions-screen__header">
        <div>
          <h1>جرّب القرار قبل ما <em>تلتزم.</em></h1>
          <p>اتخذ قرارك بخصوص شراء السيارة واكتشف أثره على مستقبلك في 2036.</p>
        </div>
        {onBack && (
          <button type="button" className="decisions-back" onClick={onBack}>
            <ArrowRight size={18} aria-hidden="true" />
            رجوع
          </button>
        )}
      </header>

      <section className="decision-grid decision-grid--focused" aria-label="قرار السيارة المتاح">
        <button type="button" className="decision-card decision-card--active" onClick={onSelectCar}>
          <span className="decision-card__hero">
            <span className="decision-card__copy">
              <span className="decision-card__eyebrow"><BadgeCheck size={15} aria-hidden="true" /> محاكاة كاملة وجاهزة</span>
              <strong>شراء سيارة</strong>
              <small>كوّن عرضك ثم شاهد كيف يتغير القسط ومساحة الشهر وثلاثة مسارات لمستقبلك.</small>
            </span>
            <span className="decision-card__visual" aria-hidden="true">
              <span className="decision-card__icon"><CarFront size={39} strokeWidth={1.55} /></span>
              <i /><i /><i />
            </span>
          </span>
          <span className="decision-card__route" aria-hidden="true">
            <span><i>1</i><b>عرض السيارة</b></span>
            <em />
            <span><i>2</i><b>التزامك الشهري</b></span>
            <em />
            <span><i>3</i><b>أثر 2036</b></span>
          </span>
          <span className="decision-card__launch">
            <span>ابدأ بتكوين العرض</span>
            <ArrowUpLeft size={19} aria-hidden="true" />
          </span>
        </button>
        <aside className="decision-roadmap">
          <div className="decision-roadmap__heading"><Compass size={21} aria-hidden="true" /><span>قرارات قادمة</span></div>
          <div><h2>المحاكاة تتوسع معك</h2><p>رحلة السيارة متاحة الآن. لاحقًا ستقدر تختبر قرارات كبيرة أخرى بالطريقة نفسها قبل الالتزام بها.</p></div>
          <div className="decision-roadmap__topics" aria-label="القرارات المخطط لها"><span>السكن</span><span>السفر</span><span>الاستثمار</span><span>التعليم</span></div>
        </aside>
      </section>
    </main>
  )
}
