import { ArrowLeft, CarFront, Clock3, PiggyBank, Shield, WalletCards } from 'lucide-react'
import { motion } from 'framer-motion'
import { Money } from './Money'
import type { ScenarioResult } from '../types/finance'

export function RippleChain({ selected, best, goalLabel = 'الهدف المالي' }: { selected: ScenarioResult; best: ScenarioResult; goalLabel?: string }) {
  const goalDelay = selected.goalDelayVsBestMonths ?? selected.goalDelayMonths
  const nodes = [
    { icon: CarFront, label: 'التزام السيارة', value: <Money value={selected.averageMonthlyVehicleObligation} />, note: 'القسط + احتياطي الدفعة الأخيرة' },
    { icon: WalletCards, label: 'مساحة الشهر', value: <Money value={selected.monthlyFlexibility} />, note: 'بعد المصاريف والالتزام' },
    { icon: Shield, label: 'احتياطي الأمان', value: <><bdi className="ltr-number">{selected.emergencyFundMonths.toFixed(1)}</bdi> شهر</>, note: 'أقل مستوى في المسار' },
    { icon: PiggyBank, label: 'فجوة الاستثمار', value: <Money value={Math.max(0, best.investments - selected.investments)} />, note: 'مقارنة بأعلى مسار في النموذج' },
    { icon: Clock3, label: `توقيت ${goalLabel}`, value: goalDelay > 0 ? <><bdi className="ltr-number">{goalDelay}</bdi> شهرًا</> : 'في الموعد', note: 'مقارنة بأسرع مسار' },
  ]

  return (
    <section className="ripple-chain" aria-labelledby="ripple-title">
      <header><span>الأثر غير الظاهر</span><h2 id="ripple-title">السيارة مو سعرها وبس.</h2><p>التزام واحد يتحرك في باقي حياتك.</p></header>
      <div className="ripple-chain__line" aria-hidden="true"><motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} /></div>
      <div className="ripple-chain__nodes">
        {nodes.map(({ icon: Icon, label, value, note }, index) => (
          <motion.article key={label} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .1 }}>
            <span className="ripple-chain__index">0{index + 1}</span>
            <i><Icon size={19} /></i><h3>{label}</h3><b>{value}</b><p>{note}</p>
            {index < nodes.length - 1 && <ArrowLeft className="ripple-chain__arrow" size={16} />}
          </motion.article>
        ))}
      </div>
    </section>
  )
}
