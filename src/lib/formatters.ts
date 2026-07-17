export const formatSAR = (value: number, compact = false) => {
  if (compact && Math.abs(value) >= 1_000) {
    return `${new Intl.NumberFormat('en-SA', { maximumFractionDigits: value >= 100_000 ? 0 : 1 }).format(value / 1_000)} ألف ر.س`
  }

  return `${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 }).format(Math.round(value))} ر.س`
}

export const formatPercent = (value: number, digits = 0) =>
  `${new Intl.NumberFormat('en-SA', { maximumFractionDigits: digits }).format(value * 100)}٪`

export const formatMonths = (value: number) =>
  value === 0 ? 'في الموعد' : `${Math.round(value)} شهرًا`

export const signedSAR = (value: number) => `${value >= 0 ? '+' : '−'}${formatSAR(Math.abs(value))}`

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
