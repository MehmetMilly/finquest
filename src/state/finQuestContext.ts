import { createContext, useContext } from 'react'
import type { FinQuestStore } from './FinQuestState'

export const FinQuestStateContext = createContext<FinQuestStore | null>(null)

export function useFinQuestState(): FinQuestStore {
  const context = useContext(FinQuestStateContext)
  if (!context) throw new Error('useFinQuestState must be used within FinQuestStateProvider')
  return context
}
