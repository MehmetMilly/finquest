import { MessageCircleMore, Sparkles, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import {
  buildCompactNarrativeFacts,
  createDeterministicNarrativeFallback,
  requestGroundedNarrative,
  type GroundedNarrativeReply,
  type NarrativeFocus,
} from '../services/narrative'
import type { ScenarioResult } from '../types/finance'
import { DialogPortal } from './DialogPortal'
import { useAccessibleDialog } from './useAccessibleDialog'

export interface FutureChatProps {
  /** The deterministic scenarios that power every answer in the sheet. */
  results: ScenarioResult[]
  /** The path currently being considered on the home screen. */
  activeScenarioId?: ScenarioResult['id']
  open: boolean
  onClose: () => void
}

type PromptId = 'room' | 'emergency' | 'calm'

const prompts: Array<{ id: PromptId; label: string }> = [
  { id: 'room', label: 'هل القسط يضيّق الشهر؟' },
  { id: 'emergency', label: 'كيف يبدو صندوق الطوارئ؟' },
  { id: 'calm', label: 'أي مسار أهدأ؟' },
]

const focusForPrompt: Record<PromptId, NarrativeFocus> = {
  room: 'monthly_room',
  emergency: 'emergency_fund',
  calm: 'comparison',
}

export function FutureChat({ results, activeScenarioId, open, onClose }: FutureChatProps) {
  const active = useMemo(
    () => results.find((scenario) => scenario.id === activeScenarioId) ?? results[0],
    [activeScenarioId, results],
  )
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useAccessibleDialog({ open: open && Boolean(active), onClose, dialogRef, initialFocusRef: closeRef })

  const [selectedPrompt, setSelectedPrompt] = useState<PromptId>('room')
  const initialFacts = useMemo(() => buildCompactNarrativeFacts(results, active?.id, focusForPrompt[selectedPrompt]), [active?.id, results, selectedPrompt])
  const factsKey = initialFacts ? JSON.stringify(initialFacts) : ''
  const fallbackReply = initialFacts ? createDeterministicNarrativeFallback(initialFacts) : null
  const [replyState, setReplyState] = useState<{ key: string; reply: GroundedNarrativeReply } | null>(null)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const reply = replyState?.key === factsKey ? replyState.reply : fallbackReply
  const loading = loadingKey === factsKey

  if (!open || !active) return null

  const ask = async (prompt: PromptId) => {
    setSelectedPrompt(prompt)
    const facts = buildCompactNarrativeFacts(results, active.id, focusForPrompt[prompt])
    if (!facts) return
    const key = JSON.stringify(facts)
    setReplyState({ key, reply: createDeterministicNarrativeFallback(facts) })
    setLoadingKey(key)
    const next = await requestGroundedNarrative(facts)
    setReplyState({ key, reply: next })
    setLoadingKey((current) => current === key ? null : current)
  }

  return (
    <DialogPortal>
      <div ref={dialogRef} className="future-chat" role="dialog" aria-modal="true" aria-labelledby="future-chat-title" dir="rtl" tabIndex={-1}>
        <div className="future-chat__scrim" aria-hidden="true" tabIndex={-1} data-dialog-scrim="true" onClick={onClose} />
        <aside className="future-chat__sheet">
          <header className="future-chat__head">
            <div className="future-chat__identity">
              <span className="future-chat__glyph"><Sparkles size={15} aria-hidden="true" /></span>
              <div>
                <span>ذاتي · نسختك المستقبلية</span>
                <h2 id="future-chat-title">اسأل عن أثر القرار</h2>
              </div>
            </div>
            <button type="button" ref={closeRef} className="future-chat__close" aria-label="إغلاق محادثة المستقبل" onClick={onClose}><X size={18} aria-hidden="true" /></button>
          </header>

          <div className="future-chat__intro">
            <MessageCircleMore size={17} aria-hidden="true" />
            <p>اختر سؤالًا لطلب شرح قصير. الأرقام من المحاكاة الحتمية؛ الذكاء الاصطناعي يشرحها فقط.</p>
          </div>

          <div className="future-chat__prompts" aria-label="أسئلة مقترحة">
            {prompts.map((prompt) => (
              <button
                type="button"
                key={prompt.id}
                className={selectedPrompt === prompt.id ? 'is-selected' : ''}
                onClick={() => void ask(prompt.id)}
              >
                {prompt.label}
              </button>
            ))}
          </div>

          <output className="future-chat__reply" aria-live="polite">
            <span>{loading ? 'ذاتي تراجع الأرقام…' : reply?.source === 'openrouter' ? 'شرح AI مبني على الحسابات' : 'شرح محلي جاهز'}</span>
            <p>{reply?.text}</p>
          </output>

          <footer>الحسابات حتمية · شرح AI اختياري · ليست نصيحة مالية</footer>
        </aside>
      </div>
    </DialogPortal>
  )
}
