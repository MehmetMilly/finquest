import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp } from 'lucide-react'
import type { FinancialDNA, FinancialProfile } from '../types/finance'
import { formatPercent, formatSAR } from '../lib/formatters'
import { CountUp } from '../components/CountUp'

export function DnaStage({ profile, dna, onNext }: { profile: FinancialProfile; dna: FinancialDNA; onNext: () => void }) {
  const rings = [dna.savingsRate / .25, dna.emergencyFundMonths / 6, 1 - dna.debtPressure, dna.investmentConsistency, dna.healthScore / 100]
  return (
    <section className="stage dna-stage">
      <div className="dna-visual">
        <div className="fingerprint" aria-label={`Financial health score ${dna.healthScore} out of 100`}>
          <svg viewBox="0 0 240 240">
            {rings.map((value, index) => {
              const radius = 96 - index * 15
              const circumference = 2 * Math.PI * radius
              return <motion.circle key={radius} cx="120" cy="120" r={radius} fill="none" strokeWidth={index === 4 ? 8 : 3} strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - Math.min(1, value)) }} transition={{ duration: 1.1, delay: index * .12 }} />
            })}
          </svg>
          <div><CountUp value={dna.healthScore} /><span>Financial health</span></div>
        </div>
        <div className="category-threads">
          {profile.spending.slice(0, 5).map((item) => <div key={item.key}><span style={{ width: `${item.amount / 18}px`, background: item.color }} /><b>{item.label}</b><em>{formatSAR(item.amount)}</em></div>)}
        </div>
      </div>
      <div className="dna-copy">
        <span className="eyebrow">Your Financial DNA</span>
        <h1>{profile.persona}</h1>
        <p className="lead">{profile.personaNote}</p>
        <div className="ledger-metrics">
          <div><span>Monthly income</span><b>{formatSAR(profile.monthlyIncome)}</b><em>steady</em></div>
          <div><span>Current breathing room</span><b>{formatSAR(dna.monthlySurplus)}</b><em>before a new payment</em></div>
          <div><span>Emergency runway</span><b>{dna.emergencyFundMonths.toFixed(1)} months</b><em>building</em></div>
          <div><span>Wealth-building rate</span><b>{formatPercent(dna.savingsRate)}</b><em><TrendingUp size={13} /> can accelerate</em></div>
        </div>
        <button className="primary-cta" onClick={onNext}>Meet future Sara <ArrowRight size={18} /></button>
      </div>
    </section>
  )
}
