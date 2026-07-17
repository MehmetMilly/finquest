import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, ShieldCheck, Sparkles } from 'lucide-react'
import { useState, type FormEvent, type CSSProperties } from 'react'
import { ASSUMPTIONS } from '../data/assumptions'
import { primaryProfile } from '../data/mockProfiles'
import {
  cloneFinancialProfile,
  FALLBACK_PROFILE_DRAFT,
  parseSARInput,
  profileFromDraft,
  validateProfileDraft,
  type ActiveFinancialProfile,
  type ProfileDraft,
  type ProfileDraftField,
  type ProfileValidationErrors,
} from '../state/profile'
import '../styles/support.css'

export interface OnboardingScreenProps {
  onComplete: (profile: ActiveFinancialProfile) => void
}

type OnboardingView = 'welcome' | 'form'

type FormValues = {
  displayName: string
  monthlyIncome: string
  essentialSpending: string
  flexibleSpending: string
  currentSavings: string
  existingMonthlyDebtObligations: string
  monthlyInvestment: string
  goal: string
  goalAmount: string
}

type AmountField = Exclude<ProfileDraftField, 'displayName' | 'goal' | 'goalAmount' | 'budget'>

const amountFields: readonly AmountField[] = [
  'monthlyIncome',
  'essentialSpending',
  'flexibleSpending',
  'currentSavings',
  'existingMonthlyDebtObligations',
  'monthlyInvestment',
]

const formFieldLabels: Record<AmountField, string> = {
  monthlyIncome: 'الدخل الشهري',
  essentialSpending: 'الإنفاق الأساسي',
  flexibleSpending: 'الإنفاق المرن',
  currentSavings: 'المدخرات الحالية',
  existingMonthlyDebtObligations: 'التزامات أو أقساط شهرية',
  monthlyInvestment: 'ادخار أو استثمار شهري',
}

const formValuesFromDraft = (draft: ProfileDraft): FormValues => ({
  displayName: draft.displayName,
  monthlyIncome: String(draft.monthlyIncome),
  essentialSpending: String(draft.essentialSpending),
  flexibleSpending: String(draft.flexibleSpending),
  currentSavings: String(draft.currentSavings),
  existingMonthlyDebtObligations: String(draft.existingMonthlyDebtObligations),
  monthlyInvestment: String(draft.monthlyInvestment),
  goal: draft.goal,
  goalAmount: draft.goalAmount === null ? '' : String(draft.goalAmount),
})

const EMPTY_FORM_VALUES: FormValues = {
  displayName: 'سارة',
  monthlyIncome: '',
  essentialSpending: '',
  flexibleSpending: '',
  currentSavings: '',
  existingMonthlyDebtObligations: '',
  monthlyInvestment: '',
  goal: '',
  goalAmount: '',
}

const defaultFormValues = formValuesFromDraft(FALLBACK_PROFILE_DRAFT)

function valueOrDefault(value: string, fallback: string): string {
  return value.trim() === '' ? fallback : value
}

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 50,
  padding: '10px 13px',
  border: '1px solid var(--support-line)',
  borderRadius: 12,
  color: 'var(--support-ink)',
  background: 'rgba(255, 255, 255, .58)',
  outline: 'none',
  fontSize: 16,
}

const hintStyle: CSSProperties = {
  color: 'var(--support-muted)',
  fontSize: 13,
  lineHeight: 1.55,
}

const errorStyle: CSSProperties = {
  color: '#a23d31',
  fontSize: 13,
  lineHeight: 1.5,
}

function draftFromForm(values: FormValues): ProfileDraft {
  return {
    displayName: valueOrDefault(values.displayName, defaultFormValues.displayName).trim(),
    monthlyIncome: parseSARInput(valueOrDefault(values.monthlyIncome, defaultFormValues.monthlyIncome)),
    essentialSpending: parseSARInput(valueOrDefault(values.essentialSpending, defaultFormValues.essentialSpending)),
    flexibleSpending: parseSARInput(valueOrDefault(values.flexibleSpending, defaultFormValues.flexibleSpending)),
    currentSavings: parseSARInput(valueOrDefault(values.currentSavings, defaultFormValues.currentSavings)),
    existingMonthlyDebtObligations: parseSARInput(valueOrDefault(values.existingMonthlyDebtObligations, defaultFormValues.existingMonthlyDebtObligations)),
    monthlyInvestment: parseSARInput(valueOrDefault(values.monthlyInvestment, defaultFormValues.monthlyInvestment)),
    goal: valueOrDefault(values.goal, defaultFormValues.goal).trim(),
    goalAmount: values.goalAmount.trim() === '' ? null : parseSARInput(values.goalAmount),
  }
}

function fieldError(errors: ProfileValidationErrors, field: ProfileDraftField): string | undefined {
  return errors[field]
}

/**
 * A local-only, two-path onboarding: enter a compact personal snapshot or
 * open the Sara demo in one click. Nothing here implies a bank connection.
 */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [view, setView] = useState<OnboardingView>('welcome')
  const [values, setValues] = useState<FormValues>(EMPTY_FORM_VALUES)
  const [errors, setErrors] = useState<ProfileValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[field as ProfileDraftField]
      delete next.budget
      return next
    })
  }

  const openPersonalForm = () => {
    setView('form')
    setErrors({})
  }

  const loadSaraDemo = () => {
    setIsSaving(true)
    // Clone nested spending categories so local state owns its profile object.
    onComplete(cloneFinancialProfile(primaryProfile))
  }

  const submitPersonalForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const draft = draftFromForm(values)
    const result = validateProfileDraft(draft)
    setErrors(result.errors)
    if (!result.valid) return

    setIsSaving(true)
    try {
      onComplete(profileFromDraft(draft, 'personal'))
    } catch {
      setIsSaving(false)
      setErrors({ budget: 'تعذر تجهيز هذه القراءة الآن. راجع الأرقام وحاول مرة أخرى.' })
    }
  }

  if (view === 'welcome') {
    return (
      <main className="support-screen onboarding-screen" dir="rtl" lang="ar">
        <div className="support-orbit support-orbit--one" />
        <div className="support-orbit support-orbit--two" />
        <section className="onboarding-card" aria-labelledby="onboarding-title">
          <div className="onboarding-card__intro onboarding-card__intro--welcome">
            <h1 id="onboarding-title">لنرسم مسارك المالي <em>بوضوح.</em></h1>
            <p>أرقام تقريبية من واقعك تكفي، أو يمكن البدء بنموذج سارة. سنحوّلها إلى محاكاة تعليمية تساعد على رؤية أثر القرار قبل اتخاذه.</p>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <button className="support-primary" type="button" onClick={openPersonalForm} style={{ width: '100%', justifyContent: 'space-between', paddingInline: 18 }}>
              <span>أدخل بياناتي التقريبية</span>
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <button className="support-secondary" type="button" onClick={loadSaraDemo} disabled={isSaving} style={{ width: '100%', justifyContent: 'space-between', paddingInline: 18 }}>
              <span>{isSaving ? 'نجهّز النموذج…' : 'استكشاف نموذج سارة بضغطة واحدة'}</span>
              <Sparkles size={17} aria-hidden="true" />
            </button>
          </div>

          <div className="synthetic-note" style={{ marginTop: 18 }}>
            <ShieldCheck size={17} aria-hidden="true" />
            <span><b>تجربة محلية وآمنة.</b> لا اتصال بالبنك، ولا قراءة أو إرسال لأي معاملة حقيقية. الأرقام التقريبية تبقى على هذا الجهاز.</span>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="support-screen onboarding-screen" dir="rtl" lang="ar">
      <div className="support-orbit support-orbit--one" />
      <div className="support-orbit support-orbit--two" />
      <section className="onboarding-card" aria-labelledby="personal-form-title">
        <div className="onboarding-card__masthead">
          <button className="support-secondary" type="button" onClick={() => setView('welcome')} style={{ minHeight: 34, paddingInline: 12, gap: 7 }}>
            <ArrowRight size={16} aria-hidden="true" />
            <span>رجوع</span>
          </button>
        </div>

        <div className="onboarding-card__intro onboarding-card__intro--form" style={{ marginBottom: 20 }}>
          <h1 id="personal-form-title"><span>بيانات محددة، رؤية</span><em>أوضح.</em></h1>
          <p>أدخل البيانات أو اتركها فارغة ليتم استخدام البيانات الافتراضية.</p>
        </div>

        <form onSubmit={submitPersonalForm} noValidate>
          <div style={{ display: 'grid', gap: 19 }}>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <div style={{ display: 'grid', gap: 14 }}>
                <label style={fieldStyle} htmlFor="onboarding-display-name">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>الاسم</span>
                  <input
                    id="onboarding-display-name"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    value={values.displayName}
                    onChange={(event) => updateField('displayName', event.target.value)}
                    aria-invalid={Boolean(errors.displayName)}
                    aria-describedby={errors.displayName ? 'onboarding-display-name-error' : undefined}
                    placeholder={defaultFormValues.displayName}
                    className="onboarding-input"
                    style={inputStyle}
                  />
                  {errors.displayName && <small id="onboarding-display-name-error" style={errorStyle} role="alert">{errors.displayName}</small>}
                </label>
                <label style={fieldStyle} htmlFor="onboarding-goal">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>هدف مالي واحد</span>
                  <input
                    id="onboarding-goal"
                    name="goal"
                    type="text"
                    value={values.goal}
                    onChange={(event) => updateField('goal', event.target.value)}
                    aria-invalid={Boolean(errors.goal)}
                    aria-describedby={errors.goal ? 'onboarding-goal-error' : undefined}
                    placeholder={defaultFormValues.goal}
                    className="onboarding-input"
                    style={inputStyle}
                  />
                  {errors.goal && <small id="onboarding-goal-error" style={errorStyle} role="alert">{errors.goal}</small>}
                </label>
                <label style={fieldStyle} htmlFor="onboarding-goal-amount">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>مبلغ الهدف</span>
                  <span className="onboarding-input-with-unit">
                    <input
                      id="onboarding-goal-amount"
                      name="goalAmount"
                      type="text"
                      inputMode="decimal"
                      dir="rtl"
                      value={values.goalAmount}
                      onChange={(event) => updateField('goalAmount', event.target.value)}
                      aria-invalid={Boolean(errors.goalAmount)}
                      aria-describedby={errors.goalAmount ? 'onboarding-goal-amount-error' : undefined}
                      placeholder={ASSUMPTIONS.homeDepositGoal.toLocaleString('en-US')}
                      className="onboarding-input onboarding-amount-input"
                      style={inputStyle}
                    />
                    <span className="onboarding-input-unit" aria-hidden="true">ر.س</span>
                  </span>
                  {errors.goalAmount && <small id="onboarding-goal-amount-error" style={errorStyle} role="alert">{errors.goalAmount}</small>}
                </label>
              </div>
            </fieldset>

            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', alignItems: 'start', gap: 12 }}>
                {amountFields.map((field) => {
                  const id = `onboarding-${field}`
                  const error = fieldError(errors, field)
                  const isOptional = field === 'monthlyInvestment'
                  const hint = field === 'essentialSpending'
                    ? 'السكن، الطعام، التنقل، والفواتير الأساسية.'
                    : field === 'flexibleSpending'
                      ? 'التسوق، المقاهي، الترفيه والاشتراكات.'
                      : undefined
                  return (
                    <label key={field} style={{ ...fieldStyle, gridColumn: field === 'monthlyIncome' ? '1 / -1' : undefined }} htmlFor={id}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{formFieldLabels[field]} {isOptional && <em style={{ color: 'var(--support-muted)', fontSize: 13, fontStyle: 'normal' }}>— اختياري</em>}</span>
                      <span className="onboarding-input-with-unit">
                        <input
                          id={id}
                          name={field}
                          type="text"
                          inputMode="decimal"
                          dir="rtl"
                          value={values[field]}
                          onChange={(event) => updateField(field, event.target.value)}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                          placeholder={defaultFormValues[field]}
                          className="onboarding-input onboarding-amount-input"
                          style={inputStyle}
                        />
                        <span className="onboarding-input-unit" aria-hidden="true">ر.س</span>
                      </span>
                      {hint && <small id={`${id}-hint`} style={hintStyle}>{hint}</small>}
                      {error && <small id={`${id}-error`} style={errorStyle} role="alert">{error}</small>}
                    </label>
                  )
                })}
              </div>
            </fieldset>

            {errors.budget && (
              <div className="synthetic-note" role="alert" style={{ borderInlineStartColor: '#a23d31', borderInlineEnd: 0 }}>
                <CircleHelp size={17} aria-hidden="true" />
                <span>{errors.budget}</span>
              </div>
            )}

            <div className="synthetic-note" style={{ marginTop: -2 }}>
              <CheckCircle2 size={17} aria-hidden="true" />
              <span>هذه البيانات تجريبية وتُستخدم لأغراض المحاكاة فقط.</span>
            </div>

            <button className="support-primary" type="submit" disabled={isSaving} style={{ width: '100%', justifyContent: 'space-between', paddingInline: 18 }}>
              <span>{isSaving ? 'نجهّز مسارك…' : 'بدء المحاكاة'}</span>
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
