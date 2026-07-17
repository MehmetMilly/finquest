import { AlertTriangle, ArrowLeft, GitCompareArrows, TrendingUp } from 'lucide-react'
import { FutureAvatar, resolveAvatarMood } from '../avatar'
import { Money } from '../components/Money'
import { formatSAR } from '../lib/formatters'
import type { ScenarioId, ScenarioResult } from '../types/finance'
import '../styles/future.css'

const scenarioNames: Record<ScenarioId, string> = {
  finance: 'تمويل الآن',
  used: 'شراء أذكى',
  delay: 'انتظار سنة',
}

export interface FutureScreenProps {
  results: ScenarioResult[]
  selectedScenarioId: ScenarioId
  onSelectScenario: (id: ScenarioId) => void
  onCompare: () => void
  displayName?: string
  futureAge?: number
}

export function FutureScreen({ results, selectedScenarioId, onSelectScenario, onCompare, displayName = 'نسختك', futureAge }: FutureScreenProps) {
  const selected = results.find((item) => item.id === selectedScenarioId) ?? results[0]
  const best = [...results].sort((a, b) => b.netWorth - a.netWorth)[0]
  if (!selected || !best) return <p>لا توجد محاكاة محفوظة بعد.</p>
  const last = selected.timeline.at(-1)
  const first = selected.timeline[0]
  const decadeChange = (last?.netWorth ?? selected.netWorth) - (first?.netWorth ?? 0)

  return (
    <main className="future-overview" dir="rtl">
      <header className="future-overview__head">
        <div><h1>مستقبلك مو خط واحد.</h1><p>غيّر المسار وشوف كيف يتغير صوت نسختك.</p></div>
        <button className="future-primary" onClick={onCompare}>قارن المسارات <ArrowLeft size={18} /></button>
      </header>

      <section className="future-overview__stage">
        <div className="future-overview__avatar"><span>{futureAge === undefined ? 'نسختك بعد 10 سنوات' : <><bdi>{displayName}</bdi> · <bdi className="ltr-number">{futureAge}</bdi> سنة</>}</span><FutureAvatar mood={resolveAvatarMood({ scenario: selected, screen: 'futures' })} size="lg" label={`${displayName} في 2036`} /></div>
        <div className="future-overview__signal">
          <span>المسار المفتوح</span><h2>{scenarioNames[selected.id]}</h2>
          <blockquote>{selected.id === 'finance' ? 'القرار ممكن… لكن الشهر يصير أضيق.' : selected.id === 'used' ? 'السيارة أصغر. المساحة أكبر.' : 'سنة صبر أعطت المستقبل نفسًا أطول.'}</blockquote>
          <div className="future-overview__worth"><span>صافي الثروة المحسوب في 2036</span><Money value={selected.netWorth} />{selected.opportunityCost > 0 && <small>فجوة <Money value={selected.opportunityCost} /> عن أعلى مسار</small>}{selected.unfundedShortfall > 0 && <strong className="future-shortfall"><AlertTriangle size={14} /> عجز غير مغطى <Money value={selected.unfundedShortfall} /> خلال <bdi className="ltr-number">{selected.unfundedMonths}</bdi> شهرًا</strong>}</div>
        </div>
        <div className="future-overview__timeline" aria-label="خط زمني لصافي الثروة">
          <div className="future-overview__timeline-head"><span><TrendingUp size={16} /> نمو عشر سنوات</span><Money value={decadeChange} /></div>
          <div className="future-overview__chart">
            {selected.timeline.map((point) => {
              const max = Math.max(...selected.timeline.map((item) => Math.max(0, item.netWorth)), 1)
              return <i key={point.year} style={{ height: `${Math.max(8, (Math.max(0, point.netWorth) / max) * 100)}%` }} title={`${point.year}: ${formatSAR(point.netWorth)}`} />
            })}
          </div>
          <div className="future-overview__milestones">
            <span><small>البداية</small><b>2026</b><Money value={first?.netWorth ?? 0} /></span>
            <i aria-hidden="true" />
            <span><small>الأفق</small><b>2036</b><Money value={last?.netWorth ?? selected.netWorth} /></span>
          </div>
          <p><TrendingUp size={15} /> {last ? <>ينتهي المسار عند <Money value={last.netWorth} /></> : 'محاكاة عشر سنوات'}</p>
        </div>
      </section>

      <section className="future-path-switcher" aria-label="اختيار المسار">
        {results.map((result, index) => (
          <button key={result.id} data-scenario={result.id} className={result.id === selected.id ? 'is-active' : ''} onClick={() => onSelectScenario(result.id)} aria-pressed={result.id === selected.id}>
            <span className="future-path-switcher__top"><i>{String(index + 1).padStart(2, '0')}</i><strong>{scenarioNames[result.id]}</strong>{result.id === best.id && <em>الأكثر مرونة</em>}</span>
            <Money value={result.netWorth} className="future-path-switcher__amount" />
            <span className="future-path-switcher__stress"><i><b style={{ width: `${Math.max(8, Math.min(100, result.stressScore))}%` }} /></i><small>{result.id === best.id ? 'أفضل مساحة في النموذج' : `${Math.round(result.stressScore)} من 100 ضغط`}</small></span>
            <span className="future-path-switcher__select">{result.id === selected.id ? 'المسار المعروض' : 'اعرض المسار'} <ArrowLeft size={14} /></span>
          </button>
        ))}
        <button className="future-path-switcher__compare" onClick={onCompare}><GitCompareArrows size={18} /> افتح المقارنة الكاملة</button>
      </section>
    </main>
  )
}
