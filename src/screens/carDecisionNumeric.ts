export interface NumericDraftBounds {
  min: number
  max: number
}

/**
 * Commit a temporary numeric input only when it contains a finite value.
 * Empty and malformed drafts intentionally resolve to the last valid value;
 * clamping is deferred until this commit boundary rather than while typing.
 */
export function commitNumericDraft(draft: string, bounds: NumericDraftBounds, fallback: number): number {
  const trimmed = draft.trim()
  if (!trimmed) return fallback

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return fallback

  const lower = Math.min(bounds.min, bounds.max)
  const upper = Math.max(bounds.min, bounds.max)
  return Math.min(upper, Math.max(lower, Math.round(parsed)))
}

