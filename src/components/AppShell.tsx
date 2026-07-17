import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  CarFront,
  GitFork,
  Home,
  Info,
  RotateCcw,
  Target,
  UserCircle2,
  X,
} from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { FutureAvatar, type AvatarMood } from '../avatar'
import { ASSUMPTIONS, MODEL_DISCLOSURES } from '../data/assumptions'
import type { AppTab, ToastMessage } from '../state'
import { DialogPortal } from './DialogPortal'
import { Money } from './Money'
import { useAccessibleDialog } from './useAccessibleDialog'
import '../styles/shell.css'

const navItems: Array<{ id: AppTab; label: string; hint: string; icon: typeof Home }> = [
  { id: 'home', label: 'اليوم', hint: 'نسختك الآن', icon: Home },
  { id: 'decisions', label: 'القرارات', hint: 'جرّب قبل ما تلتزم', icon: CarFront },
  { id: 'future', label: 'المستقبل', hint: 'ثلاثة مسارات', icon: GitFork },
  { id: 'quests', label: 'المهام', hint: 'خطوات تغيّر المسار', icon: Target },
  { id: 'account', label: 'حسابي', hint: 'البيانات والافتراضات', icon: UserCircle2 },
]

const tabMood: Record<AppTab, AvatarMood> = {
  home: 'encouraging',
  decisions: 'thinking',
  future: 'focused',
  quests: 'proud',
  account: 'calm',
}

export interface AppShellProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  assumptionsOpen: boolean
  onAssumptionsChange: (open: boolean) => void
  onReset: () => void
  onFutureClick?: () => void
  toast?: ToastMessage | null
  onDismissToast?: () => void
  goalLabel?: string
  goalAmount?: number
  goalAmountIsIllustrative?: boolean
  children: ReactNode
}

export function AppShell({
  activeTab,
  onTabChange,
  assumptionsOpen,
  onAssumptionsChange,
  onReset,
  onFutureClick,
  toast,
  onDismissToast,
  goalLabel = 'الهدف المالي',
  goalAmount = ASSUMPTIONS.homeDepositGoal,
  goalAmountIsIllustrative = true,
  children,
}: AppShellProps) {
  const reducedMotion = useReducedMotion()
  const assumptionsDialogRef = useRef<HTMLElement>(null)
  const assumptionsCloseRef = useRef<HTMLButtonElement>(null)
  useAccessibleDialog({
    open: assumptionsOpen,
    onClose: () => onAssumptionsChange(false),
    dialogRef: assumptionsDialogRef,
    initialFocusRef: assumptionsCloseRef,
  })

  return (
    <div className="app-shell" dir="rtl" lang="ar">
      <aside className="app-rail">
        <button className="app-brand" onClick={() => onTabChange('home')} aria-label="FinQuest 2036 - الرئيسية">
          <span className="app-brand__mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img">
              <path className="app-brand__orbit" d="M34.8 31.2A15.3 15.3 0 1 0 27.6 39" />
              <path className="app-brand__path" d="M25.7 29.5c5.6 2.1 9.1 5.9 12.1 10.4" />
              <rect className="app-brand__point" x="36" y="38" width="5" height="5" rx="1.3" />
            </svg>
          </span>
          <span><b>FinQuest</b><em>2036</em></span>
        </button>

        <nav className="app-nav" aria-label="التنقل الرئيسي">
          {navItems.map(({ id, label, hint, icon: Icon }) => (
            <button
              key={id}
              className={activeTab === id ? 'app-nav__item is-active' : 'app-nav__item'}
              onClick={() => onTabChange(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              data-testid={`nav-${id}`}
            >
              <span className="app-nav__icon"><Icon size={20} strokeWidth={1.8} /></span>
              <span><b>{label}</b><small>{hint}</small></span>
            </button>
          ))}
        </nav>

        <button className="rail-companion" onClick={onFutureClick} aria-label="تحدث مع نسختك في 2036">
          <FutureAvatar mood={tabMood[activeTab]} size="sm" variant="card" />
          <span>ذاتي معك الآن<small>اسأل نسختك في 2036</small></span>
        </button>
      </aside>

      <section className="app-workspace">
        <header className="app-header">
          <div className="app-header__actions">
            <button className="header-action header-action--info" aria-label="معلومات وافتراضات المحاكاة" onClick={() => onAssumptionsChange(true)}><Info size={19} aria-hidden="true" /></button>
          </div>
        </header>

        <div className="app-page">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              className="app-page__motion"
              key={activeTab}
              initial={reducedMotion ? false : { opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: reducedMotion ? .01 : .28, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <nav className="mobile-nav" aria-label="التنقل الرئيسي للجوال">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={activeTab === id ? 'is-active' : ''} onClick={() => onTabChange(id)} aria-current={activeTab === id ? 'page' : undefined}>
            <Icon size={20} /><span>{label}</span>
          </button>
        ))}
      </nav>

      <button className="mobile-companion" onClick={onFutureClick} aria-label="تحدث مع ذاتي">
        <FutureAvatar mood={tabMood[activeTab]} size="sm" variant="glyph" />
      </button>

      <DialogPortal>
        <AnimatePresence>
          {assumptionsOpen && (
            <>
              <motion.div className="sheet-scrim" aria-hidden="true" tabIndex={-1} data-dialog-scrim="true" onClick={() => onAssumptionsChange(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              <motion.aside ref={assumptionsDialogRef} className="assumptions-sheet" role="dialog" aria-modal="true" aria-labelledby="assumptions-title" dir="rtl" lang="ar" tabIndex={-1} initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 290, damping: 32 }}>
                <header><div><span>داخل النموذج</span><h2 id="assumptions-title">افتراضات المحاكاة</h2></div><button type="button" ref={assumptionsCloseRef} onClick={() => onAssumptionsChange(false)} aria-label="إغلاق الافتراضات"><X aria-hidden="true" /></button></header>
                <p>كل رقم ناتج عن محاكاة حتمية لعشر سنوات. طبقة القصة تشرح النتائج ولا تنشئها.</p>
                <div className="assumptions-list">
                  <span><b>نمو الراتب</b><em><bdi className="ltr-number">{(ASSUMPTIONS.annualSalaryGrowth * 100).toFixed(1)}</bdi>٪ سنويًا</em></span>
                  <span><b>تضخم المعيشة</b><em><bdi className="ltr-number">{(ASSUMPTIONS.annualInflation * 100).toFixed(1)}</bdi>٪ سنويًا</em></span>
                  <span><b>عائد الاستثمار</b><em><bdi className="ltr-number">{(ASSUMPTIONS.annualInvestmentReturn * 100).toFixed(1)}</bdi>٪ سنويًا</em></span>
                  <span><b>مرجع تكلفة التمويل</b><em><bdi className="ltr-number">{(ASSUMPTIONS.illustrativeFinancingRate * 100).toFixed(1)}</bdi>٪</em></span>
                  <span><b>هدف الطوارئ</b><em><bdi className="ltr-number">{ASSUMPTIONS.emergencyFundTargetMonths}</bdi> أشهر</em></span>
                  <span><b><bdi>{goalLabel}</bdi></b><em><Money value={goalAmount} /> {goalAmountIsIllustrative ? '· توضيحي' : ''}</em></span>
                  <span><b>أفق المحاكاة</b><em><bdi className="ltr-number">{ASSUMPTIONS.years}</bdi> سنوات</em></span>
                </div>
                <div className="assumptions-warning"><b>{MODEL_DISCLOSURES.existingDebt.title}</b><span>{MODEL_DISCLOSURES.existingDebt.detail}</span></div>
                <div className="assumptions-warning"><b>للتعليم فقط</b><span>ليست نصيحة مالية أو استثمارية أو ائتمانية. القيم المستقبلية توضيحية وليست توقعات.</span></div>
                <button type="button" className="reset-link" onClick={onReset}><RotateCcw size={16} aria-hidden="true" /> إعادة التجربة من البداية</button>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </DialogPortal>

      <AnimatePresence>
        {toast && (
          <motion.div className={`app-toast app-toast--${toast.tone ?? 'info'}`} role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <span>{toast.message}</span><button onClick={onDismissToast} aria-label="إغلاق التنبيه"><X size={15} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
