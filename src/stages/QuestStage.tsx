import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { ScenarioResult } from '../types/finance'
import { formatSAR } from '../lib/formatters'
import { TemporalPortrait } from '../components/TemporalPortrait'
import { ASSUMPTIONS } from '../data/assumptions'

export function QuestStage({ results, onReset }: { results: ScenarioResult[]; onReset: () => void }) {
  const [accepted, setAccepted] = useState(false)
  const futureValue = 1_500 * Math.pow(1 + ASSUMPTIONS.annualInvestmentReturn, ASSUMPTIONS.years)
  const best = results.find((item) => item.id === 'delay')!
  return (
    <section className={`stage quest-stage ${accepted ? 'quest-stage--accepted' : ''}`}>
      <div className="quest-horizon"><TemporalPortrait mood="open" label="S" /><span>2036 signal</span><b>{accepted ? 'Future shifted' : 'Waiting for you'}</b></div>
      <div className="quest-copy">
        <span className="eyebrow">Your next move</span>
        <AnimatePresence mode="wait">
          {!accepted ? (
            <motion.div key="offer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -16 }}>
              <h1>30-Day<br /><em>Future Rescue</em></h1>
              <p>Delay the upgrade for 30 days. Redirect 1,500 SAR to your Future Fund before making the call.</p>
              <div className="quest-outcomes"><span><em>Protect now</em><b>{formatSAR(1_500)}</b></span><span><em>Possible 10-year value</em><b>≈ {formatSAR(futureValue)}</b></span><span><em>Quest reward</em><b>+ 350 XP</b></span></div>
              <button className="primary-cta" onClick={() => setAccepted(true)}>Accept the quest <ArrowRight size={18} /></button>
            </motion.div>
          ) : (
            <motion.div key="accepted" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="quest-stamp"><Check /><span>QUEST ACCEPTED</span></div>
              <h1>This is the month<br /><em>our future started changing.</em></h1>
              <p>Your first transfer is protected. The decision is still yours—now with more room around it.</p>
              <div className="changed-future"><span><Sparkles /> Future Fund · before → after</span><b><s>0 SAR</s><i>→</i>{formatSAR(1_500)}</b><em>≈ {formatSAR(futureValue)} possible value in 2036 · strongest path remains {formatSAR(best.netWorth, true)}</em></div>
              <button className="primary-cta" onClick={onReset}>Replay the future <ArrowRight size={18} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <footer className="quest-footer"><span>FinQuest 2036 · AMAD hackathon prototype</span><span>Educational simulation, not financial advice.</span></footer>
    </section>
  )
}
