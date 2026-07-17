/** Converts an effective annual rate to the rate applied each month. */
export function monthlyRateFromEffectiveAnnual(annualEffectiveRate: number): number {
  if (!Number.isFinite(annualEffectiveRate) || annualEffectiveRate <= -1) {
    throw new RangeError('annualEffectiveRate must be a finite number greater than -1.')
  }

  return Math.pow(1 + annualEffectiveRate, 1 / 12) - 1
}

export interface InstallmentInputs {
  principal: number
  balloonPayment?: number
  paymentMonths: number
  annualEffectiveRate: number
}

/**
 * Calculates the level monthly installment for a loan whose remaining balance
 * after the final installment is the supplied balloon payment.
 */
export function deriveMonthlyInstallment({
  principal,
  balloonPayment = 0,
  paymentMonths,
  annualEffectiveRate,
}: InstallmentInputs): number {
  if (!Number.isFinite(principal) || principal <= 0) {
    throw new RangeError('principal must be a finite number greater than 0.')
  }
  if (!Number.isFinite(balloonPayment) || balloonPayment < 0 || balloonPayment > principal) {
    throw new RangeError('balloonPayment must be a finite number between 0 and principal.')
  }
  if (!Number.isInteger(paymentMonths) || paymentMonths <= 0) {
    throw new RangeError('paymentMonths must be a positive integer.')
  }
  if (!Number.isFinite(annualEffectiveRate) || annualEffectiveRate < 0) {
    throw new RangeError('annualEffectiveRate must be a finite number greater than or equal to 0 for financing.')
  }

  const monthlyRate = monthlyRateFromEffectiveAnnual(annualEffectiveRate)
  if (monthlyRate === 0) return (principal - balloonPayment) / paymentMonths

  const discountFactor = Math.pow(1 + monthlyRate, -paymentMonths)
  return ((principal - balloonPayment * discountFactor) * monthlyRate) / (1 - discountFactor)
}
