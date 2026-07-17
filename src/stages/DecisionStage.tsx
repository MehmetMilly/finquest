import { motion } from 'framer-motion'
import { ArrowRight, Info } from 'lucide-react'
import { useState } from 'react'
import type { ScenarioId } from '../types/finance'
import { SCENARIOS } from '../data/scenarios'
import { formatPercent, formatSAR } from '../lib/formatters'

export function DecisionStage({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<ScenarioId>('finance')
  const active = SCENARIOS.find((scenario) => scenario.id === selected)!
  const effectiveCommitment = active.payment + (active.balloonPayment ?? 0) / active.paymentMonths

  return (
    <section className="stage decision-stage">
      <div className="decision-intro">
        <span className="eyebrow eyebrow--light">Decision arena · Car financing</span>
        <h1>It fits the month.<br /><em>Does it fit the life?</em></h1>
        <p>“I’m considering a 160,000 SAR car with a 2,200 SAR monthly payment for five years.”</p>
      </div>
      <motion.div className="contract-strip" layout>
        <div className="contract-strip__head"><span>Illustrative dealer offer</span><b>FQ / 160–60</b></div>
        <div className="contract-main"><span>Vehicle price</span><b>{formatSAR(160_000)}</b></div>
        <div className="contract-terms"><span><em>Monthly payment</em><b>{formatSAR(2_200)}</b></span><span><em>Term</em><b>60 months</b></span><span><em>Upfront</em><b>{formatSAR(10_000)}</b></span><span><em>Final payment</em><b>{formatSAR(25_000)}</b></span></div>
        <div className="contract-warning"><Info size={16} /><span><b>The headline leaves something out.</b> Reserving for the final payment makes the effective monthly commitment {formatSAR(2_200 + 25_000 / 60)}.</span></div>
      </motion.div>
      <div className="decision-paths" role="radiogroup" aria-label="Car decision paths">
        {SCENARIOS.map((scenario) => <button role="radio" aria-checked={selected === scenario.id} key={scenario.id} className={selected === scenario.id ? 'active' : ''} onClick={() => setSelected(scenario.id)}><i style={{ background: scenario.color }} /><span><b>{scenario.shortLabel}</b><em>{scenario.benefit}</em></span></button>)}
      </div>
      <div className="decision-action">
        <span><em>Starting payment-only ratio</em><b>{formatPercent(active.payment / 7000, 1)}</b></span>
        <span><em>Effective commitment</em><b>{formatSAR(effectiveCommitment)} / mo</b></span>
        <button className="primary-cta primary-cta--light" onClick={onNext}>Split the timeline <ArrowRight size={18} /></button>
      </div>
    </section>
  )
}
