import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'

interface CountUpProps {
  value: number
  suffix?: string
  prefix?: string
  compact?: boolean
}

export function CountUp({ value, suffix = '', prefix = '', compact = false }: CountUpProps) {
  const raw = useMotionValue(0)
  const rounded = useTransform(raw, (latest) => {
    const shown = compact && Math.abs(latest) >= 1000 ? latest / 1000 : latest
    const number = new Intl.NumberFormat('en', { maximumFractionDigits: compact && Math.abs(latest) < 100_000 ? 1 : 0 }).format(shown)
    return `${prefix}${number}${compact && Math.abs(latest) >= 1000 ? 'k' : ''}${suffix}`
  })

  useEffect(() => {
    const controls = animate(raw, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] })
    return controls.stop
  }, [raw, value])

  return <motion.span>{rounded}</motion.span>
}
