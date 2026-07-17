import { formatSAR } from '../lib/formatters'

export interface MoneyProps {
  value: number
  compact?: boolean
  className?: string
}

/**
 * Keeps the amount visually first on the right and the Arabic currency on the
 * left, regardless of the surrounding sentence direction.
 */
export function Money({ value, compact = false, className = '' }: MoneyProps) {
  const formatted = formatSAR(value, compact)
  const match = formatted.match(/^(.+?)(?:\s+(ألف))?\s+(ر\.س)$/)

  if (!match) return <bdi className={`money-value ${className}`.trim()}>{formatted}</bdi>

  return (
    <bdi className={`money-value ${className}`.trim()} dir="rtl">
      <span className="money-value__number" dir="ltr">{match[1]}</span>
      {match[2] && <span className="money-value__scale">{match[2]}</span>}
      <span className="money-value__currency">{match[3]}</span>
    </bdi>
  )
}
