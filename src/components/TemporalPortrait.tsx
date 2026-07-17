import { motion } from 'framer-motion'

interface TemporalPortraitProps {
  mood?: 'compressed' | 'steady' | 'open' | 'neutral'
  label?: string
  compact?: boolean
}

const contours = [
  'M50 8 C25 10 16 34 19 58 C21 79 34 94 50 101 C66 94 79 79 81 58 C84 34 75 10 50 8Z',
  'M50 14 C30 15 23 35 25 56 C27 72 37 86 50 92 C63 86 73 72 75 56 C77 35 70 15 50 14Z',
  'M50 21 C35 21 30 37 31 53 C32 66 40 77 50 82 C60 77 68 66 69 53 C70 37 65 21 50 21Z',
  'M50 29 C39 29 36 40 37 51 C38 60 43 68 50 72 C57 68 62 60 63 51 C64 40 61 29 50 29Z',
]

export function TemporalPortrait({ mood = 'neutral', label = 'S', compact = false }: TemporalPortraitProps) {
  return (
    <div className={`portrait portrait--${mood} ${compact ? 'portrait--compact' : ''}`} aria-hidden="true">
      <motion.svg viewBox="0 0 100 118" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}>
        <defs>
          <linearGradient id={`portrait-${mood}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".86" />
            <stop offset="1" stopColor="currentColor" stopOpacity=".18" />
          </linearGradient>
        </defs>
        {contours.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke={`url(#portrait-${mood})`}
            strokeWidth={index === 0 ? 0.75 : 0.45}
            animate={{ scale: [1, 1.012, 1], opacity: [0.45 + index * 0.1, 0.8, 0.45 + index * 0.1] }}
            transition={{ duration: 6 + index, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '50px 58px' }}
          />
        ))}
        <path d="M18 112 C27 95 39 90 50 90 C61 90 73 95 82 112" fill="none" stroke="currentColor" strokeOpacity=".38" />
        <text x="50" y="62" textAnchor="middle" className="portrait__letter">{label}</text>
      </motion.svg>
      <div className="portrait__horizon" />
    </div>
  )
}
