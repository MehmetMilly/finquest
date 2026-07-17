import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { ScenarioResult } from '../types/finance'
import { formatSAR } from '../lib/formatters'

export function RippleStage({ results, onNext }: { results: ScenarioResult[]; onNext: () => void }) {
  const financed = results.find((item) => item.id === 'finance')!
  const best = results.find((item) => item.id === 'delay')!
  const chain = [
    { label: 'Car commitment', value: formatSAR(2_200 + 25_000 / 60), note: 'payment + final-payment reserve' },
    { label: 'Monthly flexibility', value: formatSAR(financed.monthlyFlexibility), note: `before ~${formatSAR(financed.lifestyleCompression)} average lifestyle cut` },
    { label: 'Safety runway', value: `${financed.emergencyFundMonths.toFixed(1)} months`, note: 'lowest point during the path' },
    { label: 'Investment gap', value: `−${formatSAR(best.investments - financed.investments, true)}`, note: 'compounding that never started' },
    { label: 'Future goal', value: `+${financed.goalDelayMonths} months`, note: 'versus build-then-buy' },
  ]
  return (
    <section className="stage ripple-stage">
      <div className="ripple-head"><span className="eyebrow">Opportunity cost · traced</span><h1>You didn’t just buy a car.<br /><em>You bought five years of tighter breathing room.</em></h1><p>The price is one number. The ripple is the real decision.</p></div>
      <div className="ripple-map">
        <svg className="ripple-ribbon" viewBox="0 0 1000 180" preserveAspectRatio="none" aria-hidden="true"><motion.path d="M10 58 C180 58 190 58 280 72 S450 92 520 98 S700 132 990 145" fill="none" stroke="#C66D58" strokeWidth="14" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} /><motion.path d="M10 128 C240 128 320 112 500 87 S760 48 990 30" fill="none" stroke="#76B693" strokeWidth="7" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: .2 }} /></svg>
        <div className="ripple-legend"><span><i className="ripple-legend__finance" />Finance now</span><span><i className="ripple-legend__delay" />Build, then buy</span></div>
        <div className="ripple-nodes">
          {chain.map((node, index) => <motion.article key={node.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 + index * .16 }}><span>{String(index + 1).padStart(2, '0')}</span><em>{node.label}</em><b>{node.value}</b><small>{node.note}</small></motion.article>)}
        </div>
      </div>
      <div className="ripple-callout"><span>The visible cost</span><b>{formatSAR(financed.totalPayments)}</b><i /><span>The 2036 opportunity cost</span><b>{formatSAR(financed.opportunityCost)}</b></div>
      <button className="primary-cta" onClick={onNext}>Hear from all three Saras <ArrowRight size={18} /></button>
    </section>
  )
}
