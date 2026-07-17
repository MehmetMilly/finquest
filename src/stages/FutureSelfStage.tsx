import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { TemporalPortrait } from '../components/TemporalPortrait'
import type { FinancialDNA, FinancialProfile } from '../types/finance'
import { generateFutureSelfIntro } from '../services/narrative'
import { formatSAR } from '../lib/formatters'

export function FutureSelfStage({ profile, dna, onNext }: { profile: FinancialProfile; dna: FinancialDNA; onNext: () => void }) {
  const lines = generateFutureSelfIntro(profile, dna)
  return (
    <section className="stage future-stage">
      <div className="future-portrait-stage">
        <TemporalPortrait label="S" />
        <div className="future-portrait-stage__meta"><span>YOU / 2036</span><b>Sara, 33</b><em>Future signal stable</em></div>
      </div>
      <div className="future-dialogue">
        <span className="eyebrow eyebrow--light"><Sparkles size={13} /> A message across ten years</span>
        {lines.map((line, index) => <motion.h2 key={line} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 + index * .5 }}>{line}</motion.h2>)}
        <motion.div className="evidence-rail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          <span><em>Based on</em><b>{formatSAR(profile.monthlyIncome)} income</b></span>
          <span><em>Current runway</em><b>{dna.emergencyFundMonths.toFixed(1)} months</b></span>
          <span><em>Model</em><b>120 monthly steps</b></span>
        </motion.div>
        <motion.button className="primary-cta primary-cta--light" onClick={onNext} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.35 }}>Show me the decision <ArrowRight size={18} /></motion.button>
      </div>
    </section>
  )
}
