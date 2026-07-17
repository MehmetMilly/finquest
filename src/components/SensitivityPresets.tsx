import type { SensitivityAnalysis, SensitivityPresetId } from '../domain/sensitivity'
import { Money } from './Money'

export interface SensitivityPresetsProps {
  analyses: SensitivityAnalysis[]
  selectedPresetId?: SensitivityPresetId
  onSelectPreset: (presetId: SensitivityPresetId) => void
  goalLabel?: string
}

function goalChangeCopy(delta: number | null, goalLabel: string) {
  if (delta === null) return <>لا توجد مقارنة زمنية لـ«<bdi>{goalLabel}</bdi>» لأن أحد المسارين لا يصل إليه داخل أفق النموذج.</>
  if (delta === 0) return <>لا يتغير توقيت «<bdi>{goalLabel}</bdi>» داخل النموذج.</>
  return delta > 0
    ? <>يتأخر «<bdi>{goalLabel}</bdi>» <bdi className="ltr-number">{Math.round(delta)}</bdi> شهرًا داخل النموذج.</>
    : <>يتقدم «<bdi>{goalLabel}</bdi>» <bdi className="ltr-number">{Math.round(Math.abs(delta))}</bdi> شهرًا داخل النموذج.</>
}

/**
 * Presentation-only component. Its parent owns placement and selection state;
 * the figures all come from `buildSensitivityAnalyses`.
 */
export function SensitivityPresets({ analyses, selectedPresetId, onSelectPreset, goalLabel = 'الهدف المالي' }: SensitivityPresetsProps) {
  const selected = analyses.find((analysis) => analysis.preset.id === selectedPresetId)
  if (!analyses.length) return null

  return (
    <section className="sensitivity-presets" dir="rtl" aria-labelledby="sensitivity-title">
      <header>
        <span>اختبار حساسية</span>
        <h2 id="sensitivity-title">ماذا يتغير إذا تغير افتراض واحد؟</h2>
        <p>هذه اختبارات «وش لو؟» اختيارية من نفس المحاكاة، وليست المسار المتوقع أو نصيحة مالية.</p>
      </header>

      <div role="group" aria-label="افتراضات بديلة">
        {analyses.map((analysis) => (
          <button
            key={analysis.preset.id}
            type="button"
            aria-pressed={analysis.preset.id === selected?.preset.id}
            onClick={() => onSelectPreset(analysis.preset.id)}
          >
            <strong>{analysis.preset.label}</strong>
            <span>{analysis.preset.description}</span>
          </button>
        ))}
      </div>

      {selected ? (
        <output aria-live="polite">
          <p>{selected.preset.changes.map((change, index) => <span key={change.label}>{index > 0 && ' · '}{change.label}: <bdi className="ltr-number">{(change.baselineValue * 100).toFixed(1)}</bdi>٪ ← <bdi className="ltr-number">{(change.changedValue * 100).toFixed(1)}</bdi>٪</span>)}</p>
          <p>تغير صافي الثروة المحسوب: <Money value={selected.selected.netWorthDelta} /></p>
          <p>تغير مساحة الشهر: <Money value={selected.selected.monthlyFlexibilityDelta} /></p>
          <p>{goalChangeCopy(selected.selected.goalReachedMonthDelta, goalLabel)}</p>
        </output>
      ) : (
        <p className="sensitivity-presets__baseline" aria-live="polite">أنت الآن على الافتراضات الأساسية. اختر اختبارًا فقط إذا ودك تقارن أثر تغيير افتراض واحد.</p>
      )}
    </section>
  )
}
