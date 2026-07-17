export interface MockTransaction {
  id: string
  merchant: string
  category: string
  amount: number
  date: string
}

export const mockTransactions: MockTransaction[] = [
  { id: 'tx-01', merchant: 'Monthly salary', category: 'Income', amount: 7_000, date: '2026-06-27' },
  { id: 'tx-02', merchant: 'Family transfer', category: 'Family support', amount: -700, date: '2026-06-28' },
  { id: 'tx-03', merchant: 'Riyadh apartment contribution', category: 'Home', amount: -1_500, date: '2026-06-29' },
  { id: 'tx-04', merchant: 'dr.CAFE Coffee', category: 'Cafés', amount: -28, date: '2026-07-02' },
  { id: 'tx-05', merchant: 'HungerStation', category: 'Delivery', amount: -74, date: '2026-07-03' },
  { id: 'tx-06', merchant: 'SASCO', category: 'Fuel', amount: -135, date: '2026-07-04' },
  { id: 'tx-07', merchant: 'STC', category: 'Subscriptions', amount: -230, date: '2026-07-05' },
  { id: 'tx-08', merchant: 'Jarir Bookstore', category: 'Shopping', amount: -289, date: '2026-07-06' },
  { id: 'tx-09', merchant: 'Future Fund', category: 'Savings', amount: -400, date: '2026-07-07' },
  { id: 'tx-10', merchant: 'Saudi equity fund', category: 'Investments', amount: -200, date: '2026-07-07' },
]
