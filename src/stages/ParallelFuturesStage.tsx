import { motion } from 'framer-motion'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { TemporalPortrait } from '../components/TemporalPortrait'
import { CountUp } from '../components/CountUp'
import type { ScenarioId, ScenarioResult } from '../types/finance'
import { formatMonths, formatPercent, formatSAR } from '../lib/formatters'

export function ParallelFuturesStage({ results, onNext }: { results: ScenarioResult[]; onNext: () => void }) {
  const [active, setActive] = useState<ScenarioId>('delay')
  return (
    <section className="stage futures-stage">
      <div className="futures-stage__title"><span className="eyebrow eyebrow--light">One decision · Three possible 2036s</span><h1>The future <em>splits here.</em></h1></div>
      <div className="future-fork" aria-hidden="true"><span /><i /><i /><i /></div>
      <div className="future-lanes">
        {results.map((result) => (
          <motion.article
            key={result.id}
            className={`future-lane future-lane--${result.mood} ${active === result.id ? 'active' : ''}`}
            onMouseEnter={() => setActive(result.id)}
            onFocus={() => setActive(result.id)}
            tabIndex={0}
            layout
          >
            <div className="future-lane__top"><span>{result.shortLabel}</span><b>2036</b></div>
            <TemporalPortrait mood={result.mood} label="S" compact />
            <div className="future-lane__identity"><span>Possible future</span><h2>{result.futureTitle}</h2></div>
            <div className="future-lane__worth"><span>Projected net worth</span><b><CountUp value={result.netWorth} compact suffix=" SAR" /></b>{result.opportunityCost > 0 ? <em><TrendingDown /> {formatSAR(result.opportunityCost, true)} behind best path</em> : <em className="positive"><TrendingUp /> strongest flexibility</em>}</div>
            <div className="future-lane__chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={result.timeline}><defs><linearGradient id={`fill-${result.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={result.color} stopOpacity=".35"/><stop offset="1" stopColor={result.color} stopOpacity="0"/></linearGradient></defs><Area type="monotone" dataKey="netWorth" stroke={result.color} fill={`url(#fill-${result.id})`} strokeWidth={2} isAnimationActive /></AreaChart></ResponsiveContainer></div>
            <div className="future-lane__metrics">
              <span><em>Investments</em><b>{formatSAR(result.investments, true)}</b></span>
              <span><em>Lowest runway</em><b>{result.emergencyFundMonths.toFixed(1)} mo</b></span>
              <span><em>Pressure index</em><b>{result.stressScore}/100</b></span>
              <span><em>Goal delay</em><b>{formatMonths(result.goalDelayMonths)}</b></span>
            </div>
            <blockquote>{result.quote}</blockquote>
            <div className="future-lane__health"><span>Financial health</span><i><b style={{ width: `${result.healthScore}%`, background: result.color }} /></i><em>{result.healthScore}</em></div>
            <span className="future-lane__ratio">Starting commitment {formatPercent(result.debtPressure, 1)} of income</span>
          </motion.article>
        ))}
      </div>
      <div className="futures-stage__footer"><span>Educational projection · nominal SAR · assumptions available above</span><button className="primary-cta primary-cta--light" onClick={onNext}>Follow the hidden cost <ArrowRight size={18} /></button></div>
    </section>
  )
}
