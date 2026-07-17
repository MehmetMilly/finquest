import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { DecisionType } from '../content/arabic'
import { createQuestState, normalizeQuestState, type QuestLoopState } from '../domain/quests'
import type { ScenarioId } from '../types/finance'
import {
  FALLBACK_PROFILE_DRAFT,
  coerceProfileInput,
  profileToDraft,
  sourceForProfileInput,
  type ActiveFinancialProfile,
  type ActiveProfileInput,
  type ProfileDraft,
  type ProfileSource,
} from './profile'
import { ACTIVE_PROFILE_VERSION, clearPersistedProfile, loadPersistedProfile, persistProfile } from './profileStorage'
import { FinQuestStateContext } from './finQuestContext'

export type AppTab = 'home' | 'decisions' | 'future' | 'quests' | 'account'

/** A full-screen sheet or dialog currently presented above the app. */
export type OverlayView = 'onboarding' | 'scenario-details' | 'simulation' | 'quest-details' | 'settings' | null

/** A focused journey within a tab; kept separately from visual overlays. */
export type FlowView = 'default' | 'decision-picker' | 'scenario-comparison' | 'future-preview' | 'quest-progress'

export interface ToastMessage {
  id: string
  message: string
  tone?: 'success' | 'info' | 'warning'
}

export interface FinQuestState {
  onboardingComplete: boolean
  activeProfile: ActiveFinancialProfile | null
  /** Version of the profile envelope used in local storage, or null before onboarding. */
  activeProfileVersion: number | null
  profileSource: ProfileSource | null
  activeTab: AppTab
  overlay: OverlayView
  flowView: FlowView
  selectedScenarioId: ScenarioId
  selectedDecisionType: DecisionType
  questAccepted: boolean
  questCompleted: boolean
  questState: QuestLoopState
  chatOpen: boolean
  assumptionsOpen: boolean
  toast: ToastMessage | null
  simulationVersion: number
}

export interface FinQuestActions {
  /** Save an onboarding profile and leave the onboarding overlay. */
  completeOnboarding: (profile?: ActiveProfileInput) => void
  /** Set or clear the active profile without changing the current tab. */
  setActiveProfile: (profile: ActiveProfileInput | null, source?: ProfileSource) => void
  /** Alias intended for integrations that save an edited profile from a form. */
  saveProfile: (profile: ActiveProfileInput, source?: ProfileSource) => void
  /** Update a profile through the same validated draft mapping used by onboarding. */
  updateActiveProfile: (updates: Partial<ProfileDraft>) => void
  setActiveTab: (tab: AppTab) => void
  setOverlay: (overlay: OverlayView) => void
  setFlowView: (view: FlowView) => void
  selectScenario: (scenarioId: ScenarioId) => void
  selectDecisionType: (decisionType: DecisionType) => void
  acceptQuest: () => void
  completeQuest: () => void
  setQuestState: (state: QuestLoopState) => void
  setChatOpen: (open: boolean) => void
  setAssumptionsOpen: (open: boolean) => void
  showToast: (toast: Omit<ToastMessage, 'id'>) => void
  clearToast: () => void
  rerunSimulation: () => void
  reset: () => void
}

export type FinQuestStore = FinQuestState & FinQuestActions

const APP_STORAGE_KEY = 'finquest:app-state'
const APP_STORAGE_VERSION = 2

const INITIAL_STATE: FinQuestState = {
  onboardingComplete: false,
  activeProfile: null,
  activeProfileVersion: null,
  profileSource: null,
  activeTab: 'home',
  overlay: 'onboarding',
  flowView: 'default',
  selectedScenarioId: 'used',
  selectedDecisionType: 'car',
  questAccepted: false,
  questCompleted: false,
  questState: createQuestState(),
  chatOpen: false,
  assumptionsOpen: false,
  toast: null,
  simulationVersion: 0,
}

type PersistedState = Pick<
  FinQuestState,
  | 'onboardingComplete'
  | 'activeTab'
  | 'flowView'
  | 'selectedScenarioId'
  | 'selectedDecisionType'
  | 'questAccepted'
  | 'questCompleted'
  | 'simulationVersion'
> & {
  activeProfileVersion?: number | null
  profileSource?: ProfileSource | null
  questState?: QuestLoopState
}

interface StoredAppPayload {
  version: number
  state: PersistedState
}

const tabs: readonly AppTab[] = ['home', 'decisions', 'future', 'quests', 'account']
const flows: readonly FlowView[] = ['default', 'decision-picker', 'scenario-comparison', 'future-preview', 'quest-progress']
const scenarios: readonly ScenarioId[] = ['finance', 'used', 'delay']
const decisionTypes: readonly DecisionType[] = ['car', 'home', 'investment']
const profileSources: readonly ProfileSource[] = ['personal', 'sara']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isInList<T extends string>(value: unknown, list: readonly T[]): value is T {
  return typeof value === 'string' && list.includes(value as T)
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!isRecord(value)) return false
  return (
    typeof value.onboardingComplete === 'boolean' &&
    isInList(value.activeTab, tabs) &&
    isInList(value.flowView, flows) &&
    isInList(value.selectedScenarioId, scenarios) &&
    isInList(value.selectedDecisionType, decisionTypes) &&
    typeof value.questAccepted === 'boolean' &&
    typeof value.questCompleted === 'boolean' &&
    (value.questState === undefined || isRecord(value.questState)) &&
    typeof value.simulationVersion === 'number' &&
    Number.isSafeInteger(value.simulationVersion) &&
    value.simulationVersion >= 0 &&
    (value.profileSource === undefined || value.profileSource === null || isInList(value.profileSource, profileSources)) &&
    (value.activeProfileVersion === undefined || value.activeProfileVersion === null || (
      typeof value.activeProfileVersion === 'number' && Number.isSafeInteger(value.activeProfileVersion) && value.activeProfileVersion >= 0
    ))
  )
}

function loadPersistedState(): Partial<FinQuestState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY)
    if (!raw) return {}
    const payload: unknown = JSON.parse(raw)
    if (!isRecord(payload) || payload.version !== APP_STORAGE_VERSION || !isPersistedState(payload.state)) return {}
    const state = payload.state
    return {
      ...state,
      activeProfileVersion: state.activeProfileVersion ?? null,
      profileSource: state.profileSource ?? null,
      questState: normalizeQuestState(state.questState),
      // Ephemeral UI never reopens unexpectedly after a refresh.
      overlay: state.onboardingComplete ? null : 'onboarding',
      chatOpen: false,
      assumptionsOpen: false,
      toast: null,
    }
  } catch {
    return {}
  }
}

function hydrateInitialState(): FinQuestState {
  const persisted = loadPersistedState()
  const loadedProfile = loadPersistedProfile()
  const state: FinQuestState = {
    ...INITIAL_STATE,
    ...persisted,
    activeProfile: loadedProfile?.profile ?? null,
    activeProfileVersion: loadedProfile?.version ?? persisted.activeProfileVersion ?? null,
    profileSource: loadedProfile?.source ?? persisted.profileSource ?? null,
  }

  if (loadedProfile) return { ...state, onboardingComplete: true, overlay: null }

  // App-state alone can never imply that a financial profile is valid.
  return { ...state, onboardingComplete: false, overlay: 'onboarding', activeProfileVersion: null, profileSource: null }
}

function persistedSlice(state: FinQuestState): PersistedState {
  const {
    onboardingComplete,
    activeTab,
    flowView,
    selectedScenarioId,
    selectedDecisionType,
    questAccepted,
    questCompleted,
    questState,
    simulationVersion,
    activeProfileVersion,
    profileSource,
  } = state
  return {
    onboardingComplete,
    activeTab,
    flowView,
    selectedScenarioId,
    selectedDecisionType,
    questAccepted,
    questCompleted,
    questState,
    simulationVersion,
    activeProfileVersion,
    profileSource,
  }
}

export function FinQuestStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FinQuestState>(hydrateInitialState)

  useEffect(() => {
    try {
      const payload: StoredAppPayload = { version: APP_STORAGE_VERSION, state: persistedSlice(state) }
      window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Private browsing and quota failures should never block core navigation.
    }
  }, [state])

  useEffect(() => {
    persistProfile(state.activeProfile, state.profileSource)
  }, [state.activeProfile, state.profileSource])

  const completeOnboarding = useCallback((input?: ActiveProfileInput) => {
    setState((current) => {
      const source: ProfileSource = input ? sourceForProfileInput(input) : current.profileSource ?? 'personal'
      const profile = input ? coerceProfileInput(input, source) : current.activeProfile ?? coerceProfileInput(FALLBACK_PROFILE_DRAFT, 'personal')
      if (!profile) return current
      return {
        ...current,
        activeProfile: profile,
        activeProfileVersion: ACTIVE_PROFILE_VERSION,
        profileSource: source,
        onboardingComplete: true,
        overlay: null,
        simulationVersion: current.simulationVersion + 1,
      }
    })
  }, [])

  const setActiveProfile = useCallback((input: ActiveProfileInput | null, source?: ProfileSource) => {
    setState((current) => {
      if (input === null) {
        return {
          ...current,
          activeProfile: null,
          activeProfileVersion: null,
          profileSource: null,
          onboardingComplete: false,
          overlay: 'onboarding',
          simulationVersion: current.simulationVersion + 1,
        }
      }
      const resolvedSource = source ?? sourceForProfileInput(input)
      const profile = coerceProfileInput(input, resolvedSource)
      if (!profile) return current
      return {
        ...current,
        activeProfile: profile,
        activeProfileVersion: ACTIVE_PROFILE_VERSION,
        profileSource: resolvedSource,
        onboardingComplete: true,
        overlay: null,
        simulationVersion: current.simulationVersion + 1,
      }
    })
  }, [])

  const saveProfile = useCallback((input: ActiveProfileInput, source?: ProfileSource) => {
    setActiveProfile(input, source)
  }, [setActiveProfile])

  const updateActiveProfile = useCallback((updates: Partial<ProfileDraft>) => {
    setState((current) => {
      if (!current.activeProfile) return current
      const source = current.profileSource ?? 'personal'
      const mappedProfile = coerceProfileInput({ ...profileToDraft(current.activeProfile), ...updates }, source)
      if (!mappedProfile) return current
      const profile: ActiveFinancialProfile = {
        ...mappedProfile,
        id: current.activeProfile.id,
        occupation: current.activeProfile.occupation,
        currentInvestments: current.activeProfile.currentInvestments,
      }
      if (source === 'sara') {
        profile.age = current.activeProfile.age
        profile.city = current.activeProfile.city
        profile.goalAmount = mappedProfile.goalAmount ?? current.activeProfile.goalAmount
        profile.goalAmountSource = 'synthetic'
      }
      return {
        ...current,
        activeProfile: profile,
        activeProfileVersion: ACTIVE_PROFILE_VERSION,
        simulationVersion: current.simulationVersion + 1,
      }
    })
  }, [])

  const setActiveTab = useCallback((activeTab: AppTab) => {
    setState((current) => ({ ...current, activeTab, overlay: null, flowView: 'default' }))
  }, [])

  const setOverlay = useCallback((overlay: OverlayView) => {
    setState((current) => ({ ...current, overlay }))
  }, [])

  const setFlowView = useCallback((flowView: FlowView) => {
    setState((current) => ({ ...current, flowView }))
  }, [])

  const selectScenario = useCallback((selectedScenarioId: ScenarioId) => {
    setState((current) => ({ ...current, selectedScenarioId }))
  }, [])

  const selectDecisionType = useCallback((selectedDecisionType: DecisionType) => {
    setState((current) => ({ ...current, selectedDecisionType, flowView: 'decision-picker' }))
  }, [])

  const acceptQuest = useCallback(() => {
    setState((current) => ({ ...current, questAccepted: true, questCompleted: false }))
  }, [])

  const completeQuest = useCallback(() => {
    setState((current) => ({ ...current, questAccepted: true, questCompleted: true }))
  }, [])

  const setQuestState = useCallback((questState: QuestLoopState) => {
    const normalized = normalizeQuestState(questState)
    const questAccepted = normalized.activeQuestId !== null
    const questCompleted = Object.values(normalized.progressByQuest).some((progress) => progress.completed)
    setState((current) => ({ ...current, questState: normalized, questAccepted, questCompleted }))
  }, [])

  const setChatOpen = useCallback((chatOpen: boolean) => {
    setState((current) => ({ ...current, chatOpen }))
  }, [])

  const setAssumptionsOpen = useCallback((assumptionsOpen: boolean) => {
    setState((current) => ({ ...current, assumptionsOpen }))
  }, [])

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    setState((current) => ({ ...current, toast: { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` } }))
  }, [])

  const clearToast = useCallback(() => {
    setState((current) => ({ ...current, toast: null }))
  }, [])

  const rerunSimulation = useCallback(() => {
    setState((current) => ({ ...current, simulationVersion: current.simulationVersion + 1 }))
  }, [])

  const reset = useCallback(() => {
    try { window.localStorage.removeItem(APP_STORAGE_KEY) } catch { /* reset remains safe */ }
    clearPersistedProfile()
    setState({ ...INITIAL_STATE })
  }, [])

  const value = useMemo<FinQuestStore>(
    () => ({
      ...state,
      completeOnboarding,
      setActiveProfile,
      saveProfile,
      updateActiveProfile,
      setActiveTab,
      setOverlay,
      setFlowView,
      selectScenario,
      selectDecisionType,
      acceptQuest,
      completeQuest,
      setQuestState,
      setChatOpen,
      setAssumptionsOpen,
      showToast,
      clearToast,
      rerunSimulation,
      reset,
    }),
    [
      state,
      completeOnboarding,
      setActiveProfile,
      saveProfile,
      updateActiveProfile,
      setActiveTab,
      setOverlay,
      setFlowView,
      selectScenario,
      selectDecisionType,
      acceptQuest,
      completeQuest,
      setQuestState,
      setChatOpen,
      setAssumptionsOpen,
      showToast,
      clearToast,
      rerunSimulation,
      reset,
    ],
  )

  return <FinQuestStateContext.Provider value={value}>{children}</FinQuestStateContext.Provider>
}
