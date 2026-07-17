import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { TemporalPortrait } from '../components/TemporalPortrait'

export function LandingStage({ onNext }: { onNext: () => void }) {
  return (
    <section className="stage landing-stage">
      <motion.div className="year-architecture" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1 }}>2036</motion.div>
      <div className="landing-stage__copy">
        <motion.span className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>AMAD hackathon · research prototype</motion.span>
        <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>
          Meet you<br /><em>in 2036.</em>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .26 }}>Test your financial decisions before real life does.</motion.p>
        <motion.button className="primary-cta" onClick={onNext} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .36 }}>
          Open my future <ArrowUpRight size={18} />
        </motion.button>
      </div>
      <motion.div className="time-aperture" initial={{ width: 10 }} animate={{ width: 'clamp(140px, 30vw, 390px)' }} transition={{ duration: 1.1, delay: .15, ease: [0.16, 1, 0.3, 1] }}>
        <div className="time-aperture__content">
          <span className="eyebrow eyebrow--light">Riyadh · 16 JUL 2036</span>
          <TemporalPortrait label="S" />
          <div><b>Sara, age 33</b><span>Your future is online</span></div>
        </div>
      </motion.div>
      <span className="micro-disclaimer">Fictional customer data · educational scenarios</span>
    </section>
  )
}
