import { useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/AppShell'
import { ASSUMPTIONS } from './data/assumptions'
import { primaryProfile } from './data/mockProfiles'
import { SCENARIOS } from './data/scenarios'
import { calculateFinancialDNA } from './domain/financialDna'
import { deriveMonthlyInstallment } from './domain/financing'
import { recommendQuests, type QuestId, type QuestModeledEffect } from './domain/quests'
import { buildSensitivityAnalyses } from './domain/sensitivity'
import { simulateScenarios } from './domain/simulationEngine'
import { AccountScreen } from './screens/AccountScreen'
import { CarDecisionScreen, type CarDecisionInput } from './screens/CarDecisionScreen'
import { DecisionsScreen } from './screens/DecisionsScreen'
import { FutureScreen } from './screens/FutureScreen'
import { HomeScreen } from './screens/HomeScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { QuestsScreen } from './screens/QuestsScreen'
import { SimulationScreen } from './screens/SimulationScreen'
import { FinQuestStateProvider, useFinQuestState, type AppTab } from './state'
import { clearNarrativeRequestCache } from './services/narrative'
import type { ScenarioDefinition } from './types/finance'
import './styles/blue-overrides.css'

const DECISION_STORAGE_KEY = 'finquest:car-decision:v1'

function loadCarDecision(): CarDecisionInput | null {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(DECISION_STORAGE_KEY) ?? 'null')
    if (!value || typeof value !== 'object') return null
    const item = value as Record<string, unknown>
    const valid = ['price', 'deposit', 'years', 'finalPayment', 'monthlyInstallment'].every((key) => typeof item[key] === 'number' && Number.isFinite(item[key]))
    if (!valid) return null
    const price = Number(item.price)
    const deposit = Number(item.deposit)
    const years = Number(item.years)
    const finalPayment = Number(item.finalPayment)
    const installment = Number(item.monthlyInstallment)
    if (price < 60_000 || price > 400_000 || !Number.isInteger(years) || years < 3 || years > 7) return null
    if (deposit < 0 || deposit >= price || finalPayment < 0 || finalPayment >= price - deposit || installment <= 0) return null
    const expected = deriveMonthlyInstallment({ principal: price - deposit, balloonPayment: finalPayment, paymentMonths: years * 12, annualEffectiveRate: ASSUMPTIONS.illustrativeFinancingRate })
    if (Math.abs(expected - installment) > 1) return null
    return value as CarDecisionInput
  } catch {
    return null
  }
}

function clearCarDecision() {
  try { window.localStorage.removeItem(DECISION_STORAGE_KEY) } catch { /* keep reset safe */ }
}

function FinQuestApp() {
  const store = useFinQuestState()
  const [customFinance, setCustomFinance] = useState<CarDecisionInput | null>(loadCarDecision)
  const [requestedQuestId, setRequestedQuestId] = useState<QuestId | null>(null)
  const activeProfile = store.activeProfile ?? primaryProfile
  const bufferCompleted = store.questState.progressByQuest['buffer-first'].completed
  const bufferStarted = store.questState.progressByQuest['buffer-first'].started
  const modeledProfile = useMemo(
    () => bufferCompleted ? { ...activeProfile, currentSavings: activeProfile.currentSavings + 1_500 } : activeProfile,
    [activeProfile, bufferCompleted],
  )
  const dna = useMemo(() => calculateFinancialDNA(modeledProfile), [modeledProfile])
  const scenarios = useMemo<ScenarioDefinition[]>(() => {
    if (!customFinance) return SCENARIOS
    return SCENARIOS.map((scenario) => scenario.id === 'finance' ? {
      ...scenario,
      vehiclePrice: customFinance.price,
      downPayment: customFinance.deposit,
      payment: customFinance.monthlyInstallment,
      paymentMonths: customFinance.years * 12,
      balloonPayment: customFinance.finalPayment,
      carValueAfterTenYears: Math.round(customFinance.price * .225),
    } : scenario)
  }, [customFinance])
  const results = useMemo(
    () => simulateScenarios(modeledProfile, ASSUMPTIONS, scenarios),
    [modeledProfile, scenarios],
  )
  const questEffect = useMemo(() => {
    const before = simulateScenarios(activeProfile, ASSUMPTIONS, scenarios).find((item) => item.id === store.selectedScenarioId)
    const after = simulateScenarios({ ...activeProfile, currentSavings: activeProfile.currentSavings + 1_500 }, ASSUMPTIONS, scenarios).find((item) => item.id === store.selectedScenarioId)
    return before && after ? { before: before.netWorth, after: after.netWorth, delta: after.netWorth - before.netWorth } : undefined
  }, [activeProfile, scenarios, store.selectedScenarioId])
  const questModeledEffects = useMemo<Partial<Record<'buffer-first', QuestModeledEffect>>>(() => (
    questEffect ? { 'buffer-first': { ...questEffect, metric: 'صافي الثروة المحسوب في 2036', note: 'يحاكي حماية 1,500 ر.س داخل الملف.' } } : {}
  ), [questEffect])
  const questRecommendations = useMemo(() => recommendQuests(activeProfile), [activeProfile])
  const sensitivityAnalyses = useMemo(
    () => buildSensitivityAnalyses(modeledProfile, ASSUMPTIONS, scenarios, store.selectedScenarioId).analyses,
    [modeledProfile, scenarios, store.selectedScenarioId],
  )

  useEffect(() => {
    if (!store.toast) return
    const timer = window.setTimeout(store.clearToast, 3200)
    return () => window.clearTimeout(timer)
  }, [store.toast, store.clearToast])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [store.activeTab, store.flowView, store.onboardingComplete])

  if (!store.onboardingComplete) {
    return <OnboardingScreen onComplete={(profile) => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      clearNarrativeRequestCache()
      store.completeOnboarding(profile)
      store.showToast({ message: 'نسختك في 2036 جاهزة', tone: 'success' })
    }} />
  }

  const changeTab = (tab: AppTab) => {
    store.setChatOpen(false)
    if (tab === 'quests') setRequestedQuestId(null)
    store.setActiveTab(tab)
  }

  const openDecision = () => {
    store.setActiveTab('decisions')
    store.setFlowView('decision-picker')
  }

  const runSimulation = (decision: CarDecisionInput) => {
    setCustomFinance(decision)
    clearNarrativeRequestCache()
    try { window.localStorage.setItem(DECISION_STORAGE_KEY, JSON.stringify(decision)) } catch { /* in-memory fallback */ }
    store.rerunSimulation()
    store.setActiveTab('future')
    store.setFlowView('scenario-comparison')
    store.selectScenario('finance')
    store.showToast({ message: 'تم تحديث محاكاة القرار', tone: 'success' })
  }

  const openChat = () => {
    if (store.activeTab !== 'home') store.setActiveTab('home')
    store.setChatOpen(true)
  }

  let screen: React.ReactNode
  if (store.activeTab === 'home') {
    screen = (
      <HomeScreen
        results={results}
        activeScenarioId={store.selectedScenarioId}
        savingsRate={dna.savingsRate}
        displayName={activeProfile.firstName}
        goalLabel={activeProfile.goal}
        goalAmount={activeProfile.goalAmount ?? ASSUMPTIONS.homeDepositGoal}
        goalAmountIsIllustrative={activeProfile.goalAmountSource === 'illustrative'}
        questAccepted={bufferStarted}
        chatOpen={store.chatOpen}
        onChatOpenChange={store.setChatOpen}
        onTryDecision={openDecision}
        onAcceptQuest={() => {
          setRequestedQuestId('buffer-first')
          store.setActiveTab('quests')
        }}
      />
    )
  } else if (store.activeTab === 'decisions') {
    screen = store.flowView === 'decision-picker'
      ? <CarDecisionScreen monthlyIncome={activeProfile.monthlyIncome} initialDecision={customFinance ?? undefined} onBack={() => store.setFlowView('default')} onSimulate={runSimulation} />
      : <DecisionsScreen onSelectCar={() => store.setFlowView('decision-picker')} />
  } else if (store.activeTab === 'future') {
    screen = store.flowView === 'scenario-comparison'
      ? (
          <SimulationScreen
            results={results}
            selectedScenarioId={store.selectedScenarioId}
            onSelectScenario={store.selectScenario}
            onBack={() => store.setFlowView('default')}
            onStartQuest={() => {
              setRequestedQuestId('car-delay')
              store.setActiveTab('quests')
            }}
            displayName={activeProfile.firstName}
            goalLabel={activeProfile.goal}
            sensitivityAnalyses={sensitivityAnalyses}
          />
        )
      : (
          <FutureScreen
            results={results}
            selectedScenarioId={store.selectedScenarioId}
            onSelectScenario={store.selectScenario}
            onCompare={() => store.setFlowView('scenario-comparison')}
            displayName={activeProfile.firstName}
            futureAge={activeProfile.age === undefined ? undefined : activeProfile.age + ASSUMPTIONS.years}
          />
        )
  } else if (store.activeTab === 'quests') {
    screen = <QuestsScreen
      profile={activeProfile}
      recommendations={questRecommendations}
      questState={store.questState}
      onQuestStateChange={store.setQuestState}
      requestedQuestId={requestedQuestId}
      onSelectQuest={() => setRequestedQuestId(null)}
      modeledEffects={questModeledEffects}
      onStartQuest={() => store.showToast({ message: 'بدأت المهمة داخل التجربة', tone: 'success' })}
      onCompleteQuest={() => store.showToast({ message: 'اكتملت المهمة بتأكيدك الذاتي', tone: 'success' })}
      onContinue={() => store.setActiveTab('home')}
    />
  } else {
    screen = <AccountScreen profile={activeProfile} profileSource={store.profileSource} onResetDemo={() => {
      setCustomFinance(null)
      clearCarDecision()
      clearNarrativeRequestCache()
      store.reset()
    }} />
  }

  return (
    <AppShell
      activeTab={store.activeTab}
      onTabChange={changeTab}
      assumptionsOpen={store.assumptionsOpen}
      onAssumptionsChange={store.setAssumptionsOpen}
      onFutureClick={openChat}
      onReset={() => {
        setCustomFinance(null)
        clearCarDecision()
        clearNarrativeRequestCache()
        store.reset()
      }}
      toast={store.toast}
      onDismissToast={store.clearToast}
      goalLabel={activeProfile.goal}
      goalAmount={activeProfile.goalAmount ?? ASSUMPTIONS.homeDepositGoal}
      goalAmountIsIllustrative={activeProfile.goalAmountSource === 'illustrative'}
    >
      {screen}
    </AppShell>
  )
}

export default function App() {
  return <FinQuestStateProvider><FinQuestApp /></FinQuestStateProvider>
}
