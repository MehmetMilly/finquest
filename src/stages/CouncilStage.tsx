import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { TemporalPortrait } from '../components/TemporalPortrait'
import type { ScenarioResult } from '../types/finance'
import { generateCouncilDebate } from '../services/narrative'
import { formatSAR } from '../lib/formatters'

export function CouncilStage({ results, onNext }: { results: ScenarioResult[]; onNext: () => void }) {
  const [speaker, setSpeaker] = useState(0)
  const lines = generateCouncilDebate(results)
  const active = lines[speaker]
  return (
    <section className="stage council-stage">
      <div className="council-title"><span className="eyebrow eyebrow--light">Council of future selves</span><h1>Same Sara.<br /><em>Different memories.</em></h1></div>
      <div className="council-portraits">
        {results.map((result, index) => <button key={result.id} className={index === speaker ? 'active' : ''} onClick={() => setSpeaker(index)}><TemporalPortrait mood={result.mood} compact label="S" /><span>{result.futureTitle}</span><b>{formatSAR(result.netWorth, true)}</b></button>)}
      </div>
      <motion.div className="council-dialogue" key={speaker} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <span>{active.speaker}</span><blockquote>{active.line}</blockquote>
      </motion.div>
      <div className="council-controls">
        <div>{lines.map((line, index) => <button key={line.id} className={index === speaker ? 'active' : ''} onClick={() => setSpeaker(index)} aria-label={`Hear ${line.speaker}`} />)}</div>
        {speaker < lines.length - 1 ? <button className="text-button" onClick={() => setSpeaker(speaker + 1)}>Next voice <ArrowRight size={16} /></button> : <button className="primary-cta primary-cta--light" onClick={onNext}>Change the next month <ArrowRight size={18} /></button>}
      </div>
      <p className="council-consensus">The payment is affordable on paper. The future cost is the question.</p>
    </section>
  )
}
