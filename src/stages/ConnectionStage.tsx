import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

const analysisSteps = ['Reading cash flow', 'Finding recurring pressure', 'Building your 2036 baseline']

export function ConnectionStage({ onNext }: { onNext: () => void }) {
  const [connected, setConnected] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!connected) return
    const timers = [
      window.setTimeout(() => setStep(1), 700),
      window.setTimeout(() => setStep(2), 1400),
      window.setTimeout(() => setStep(3), 2300),
    ]
    return () => timers.forEach(window.clearTimeout)
  }, [connected])

  return (
    <section className="stage connect-stage">
      <div className="stage-heading">
        <span className="eyebrow">Secure profile transfer</span>
        <h1>Your patterns,<br />not just your balance.</h1>
        <p>FinQuest reads a fictional open-banking profile to build an educational baseline. No payments. No transfers.</p>
      </div>
      <div className="connect-rail">
        <motion.div className="bank-pass" animate={connected ? { x: 48, rotate: -2 } : {}}>
          <div className="bank-pass__brand"><span className="bank-glyph">✦</span> alinma</div>
          <div className="bank-pass__chip" />
          <div><span>Sandbox profile</span><b>Sara Alharbi</b></div>
          <span className="bank-pass__number">•• 2036</span>
        </motion.div>
        <div className={`scan-track ${connected ? 'scan-track--active' : ''}`}><span /></div>
        <div className="permission-panel">
          <div className="permission-panel__title"><ShieldCheck /> <div><b>One-time demo access</b><span>Alinma sandbox simulation</span></div></div>
          <ul>
            <li><Check /> Account balances</li>
            <li><Check /> 90 days of transactions</li>
            <li><Check /> Recurring obligations</li>
          </ul>
          <div className="permission-note"><LockKeyhole /> Fictional data · access ends with this session</div>
          {!connected ? (
            <button className="primary-cta primary-cta--full" onClick={() => setConnected(true)}>Connect sandbox <ArrowRight size={18} /></button>
          ) : (
            <div className="analysis-progress">
              {analysisSteps.map((label, index) => <span key={label} className={index < step ? 'done' : index === step ? 'active' : ''}>{index < step ? <Check size={14} /> : <i />}{label}</span>)}
              <AnimatePresence>{step === 3 && <motion.button className="primary-cta primary-cta--full" onClick={onNext} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>See my Financial DNA <ArrowRight size={18} /></motion.button>}</AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
