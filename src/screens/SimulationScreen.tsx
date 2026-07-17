import { AlertTriangle, ArrowRight, Check, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { FutureAvatar, resolveAvatarMood } from '../avatar'
import { FutureCouncil } from '../components/FutureCouncil'
import { Money } from '../components/Money'
import { RippleChain } from '../components/RippleChain'
import { SensitivityPresets } from '../components/SensitivityPresets'
import type { SensitivityAnalysis, SensitivityPresetId } from '../domain/sensitivity'
import type { ScenarioId, ScenarioResult } from '../types/finance'
import '../styles/future.css'

const copy: Record<ScenarioId, { name: string; line: string }> = {
  finance: { name: 'تمويل الآن', line: 'السيارة اليوم، مقابل مساحة شهرية أضيق.' },
  used: { name: 'شراء أذكى', line: 'تنقّل الآن، مع التزام أخف.' },
  delay: { name: 'انتظار سنة', line: 'ابنِ الدفعة أولًا، ثم اشترِ بنَفَس أطول.' },
}

export interface SimulationScreenProps {
  results: ScenarioResult[]
  selectedScenarioId: ScenarioId
  onSelectScenario: (id: ScenarioId) => void
  onBack: () => void
  onStartQuest: () => void
  displayName?: string
  goalLabel?: string
  sensitivityAnalyses?: SensitivityAnalysis[]
}

export function SimulationScreen({ results, selectedScenarioId, onSelectScenario, onBack, onStartQuest, displayName = 'نسختك', goalLabel = 'الهدف المالي', sensitivityAnalyses = [] }: SimulationScreenProps) {
  const [selectedSensitivityId, setSelectedSensitivityId] = useState<SensitivityPresetId | undefined>()
  const selected = results.find((item) => item.id === selectedScenarioId) ?? results[0]
  const best = [...results].sort((a, b) => b.netWorth - a.netWorth)[0]
  if (!selected || !best) return null

  return (
    <main className="simulation-screen" dir="rtl">
      <header className="simulation-head">
        <button className="simulation-back" onClick={onBack}><ArrowRight size={18} /> رجوع</button>
        <div><span className="future-kicker"><Sparkles size={14} /> قرار واحد · ثلاثة احتمالات</span><h1>هنا يتفرّق المستقبل.</h1><p>اختر مسارًا، ونسختك في 2036 ترد عليك فورًا.</p></div>
      </header>

      <section className="future-split" aria-label="المسارات المستقبلية الثلاثة">
        <svg className="future-split__horizon" viewBox="0 0 900 130" preserveAspectRatio="none" aria-hidden="true">
          <motion.path d="M450 0V35" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: .35 }} />
          <motion.path d="M450 35C450 60 150 44 150 125M450 35V125M450 35C450 60 750 44 750 125" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: .9, delay: .25, ease: [0.16,1,.3,1] }} />
        </svg>
        <div className="future-split__cards">
          {results.map((result) => (
            <button key={result.id} className={`future-card future-card--${result.id} ${selected.id === result.id ? 'is-active' : ''}`} onClick={() => onSelectScenario(result.id)} aria-pressed={selected.id === result.id}>
              <span className="future-card__choice">{selected.id === result.id ? <Check size={14} /> : null}{copy[result.id].name}</span>
              <FutureAvatar mood={resolveAvatarMood({ scenario: result, screen: 'futures' })} size="sm" variant="card" />
              <Money value={result.netWorth} /><small>صافي الثروة المحسوب</small>
            </button>
          ))}
        </div>
      </section>

      <section className={`selected-future selected-future--${selected.id}`}>
        <div className="selected-future__avatar"><FutureAvatar mood={resolveAvatarMood({ scenario: selected, screen: 'futures' })} size="lg" speaking label={`${displayName} في المستقبل`} /></div>
        <div className="selected-future__message"><span><bdi>{displayName}</bdi> · مسار {copy[selected.id].name}</span><h2>{copy[selected.id].line}</h2><p>{selected.id === 'finance' ? 'مو كل مبلغ تقدر تدفعه يناسب مستقبلك.' : selected.id === 'used' ? 'اخترت اللي يكفيك، وبقي عندك مجال.' : 'الانتظار مو تراجع. أحيانًا هو أقصر طريق للمرونة.'}</p>{selected.unfundedShortfall > 0 && <div className="selected-future__warning"><AlertTriangle size={16} /><span>هذا المسار يترك عجزًا غير مغطى قدره <Money value={selected.unfundedShortfall} /> خلال <bdi className="ltr-number">{selected.unfundedMonths}</bdi> شهرًا.</span></div>}</div>
        <div className="selected-future__metrics">
          <span><small>مساحة الشهر</small><Money value={selected.monthlyFlexibility} /></span>
          <span><small>احتياطي الأمان</small><b><bdi className="ltr-number">{selected.emergencyFundMonths.toFixed(1)}</bdi> شهر</b></span>
          <span><small>توقيت <bdi>{goalLabel}</bdi></small><b>{(selected.goalDelayVsBestMonths ?? selected.goalDelayMonths) > 0 ? <><bdi className="ltr-number">{selected.goalDelayVsBestMonths ?? selected.goalDelayMonths}</bdi> شهرًا</> : 'في الموعد'}</b></span>
        </div>
      </section>

      <SensitivityPresets analyses={sensitivityAnalyses} selectedPresetId={selectedSensitivityId} onSelectPreset={setSelectedSensitivityId} goalLabel={goalLabel} />

      <RippleChain selected={selected} best={best} goalLabel={goalLabel} />
      <FutureCouncil results={results} displayName={displayName} />

      <section className="simulation-quest-cta"><div><span>حوّل النتيجة إلى خطوة</span><h2>خطة 30 يوم لصندوق المستقبل</h2><p>أجّل القرار شهرًا واحمِ <Money value={1_500} /> داخل نموذجك.</p></div><button onClick={onStartQuest}>ابدأ المهمة</button></section>
      <p className="simulation-disclaimer">محاكاة تعليمية مبنية على افتراضات · ليست نصيحة مالية أو توقعًا للمستقبل</p>
    </main>
  )
}
