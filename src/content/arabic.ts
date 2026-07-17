import type { ScenarioId } from '../types/finance'

/** Shared RTL copy for the Arabic FinQuest experience. */
export const ARABIC_COPY = {
  appName: 'فِن كويست',
  currency: 'ر.س',
  nav: {
    home: 'اليوم',
    decisions: 'القرارات',
    future: 'المستقبل',
    quests: 'المهام',
    account: 'حسابي',
  },
  home: {
    greeting: 'خطوتك الجاية تصنع فرق',
    subtitle: 'جرّب أثر قرارك قبل ما تلتزم به.',
    primaryAction: 'جرّب قرارك',
  },
  decisions: {
    title: 'قرارك المالي، بصورة أوضح',
    subtitle: 'قارن أثر كل مسار على سيولتك وأهدافك قبل ما تلتزم.',
    chooseScenario: 'اختر مساراً للمقارنة',
    simulate: 'شغّل المقارنة',
  },
  future: {
    title: 'مستقبلك له أكثر من مسار',
    subtitle: 'قراءة تقديرية لمسارك المالي خلال السنوات الجاية.',
  },
  quests: {
    title: 'مهامك الصغيرة',
    subtitle: 'خطوة بسيطة اليوم تعطي قرارك مساحة أكبر بكرة.',
    accept: 'ابدأ المهمة',
    complete: 'أنجزت المهمة',
    accepted: 'المهمة شغّالة',
    completed: 'أنجزت المهمة — أحسنت',
  },
  account: {
    title: 'حسابي',
    subtitle: 'عدّل تجربتك وراجع افتراضات النموذج.',
  },
  settings: {
    title: 'الإعدادات',
    assumptions: 'افتراضات النموذج',
    reset: 'ابدأ من جديد',
    resetConfirm: 'بتبدأ تجربة جديدة من البداية.',
  },
  chat: {
    title: 'مساعد فِن كويست',
    placeholder: 'اكتب سؤالك المالي…',
    prompts: ['وش الفرق بين المسارات؟', 'أقدر أنتظر سنة؟', 'كيف أوسّع مرونتي المالية؟'],
    responses: {
      compare: 'المقارنة ما تختار عنك؛ توضّح أثر كل خيار على السيولة وأهدافك.',
      wait: 'الانتظار قد يكبّر الدفعة الأولى ويخفّف القسط، إذا سمحت لك ظروف دخلك والتزاماتك.',
      flexibility: 'ابدأ بهامش طوارئ صغير وثابت، وراقب التزاماتك قبل أي التزام جديد.',
      fallback: 'خلّنا نربط سؤالك بهدفك الشهري ونقارن الأثر قبل القرار.',
    },
  },
  toasts: {
    scenarioSelected: 'اخترت هذا المسار',
    simulationUpdated: 'تحدّثت المحاكاة',
    questAccepted: 'أضفت الخطة إلى مهامك',
    questCompleted: 'أنجزت المهمة',
    reset: 'بدأنا من جديد',
  },
} as const

export const NAV_TABS = [
  { id: 'home', label: ARABIC_COPY.nav.home },
  { id: 'decisions', label: ARABIC_COPY.nav.decisions },
  { id: 'future', label: ARABIC_COPY.nav.future },
  { id: 'quests', label: ARABIC_COPY.nav.quests },
  { id: 'account', label: ARABIC_COPY.nav.account },
] as const

export type DecisionType = 'car' | 'home' | 'investment'

export const DECISION_TYPES: Readonly<Record<DecisionType, { label: string; description: string }>> = {
  car: { label: 'شراء سيارة', description: 'وازن بين راحتك اليوم ومرونتك بكرة.' },
  home: { label: 'الاستعداد للسكن', description: 'حدّد احتياجك قبل الالتزام بهدف كبير.' },
  investment: { label: 'بدء الاستثمار', description: 'ابنِ عادة منتظمة قبل مطاردة العائد.' },
}

export const SCENARIO_DISPLAY: Readonly<Record<ScenarioId, { label: string; shortLabel: string; description: string }>> = {
  finance: {
    label: 'سيارة جديدة بالتقسيط',
    shortLabel: 'أقسط الآن',
    description: 'تأخذ السيارة اليوم مقابل التزام شهري أعلى.',
  },
  used: {
    label: 'سيارة مستعملة موثوقة',
    shortLabel: 'أشتري مستعملة',
    description: 'خيار متوازن يحافظ على جزء أكبر من سيولتك الشهرية.',
  },
  delay: {
    label: 'أنتظر وأبني الدفعة الأولى',
    shortLabel: 'أنتظر سنة',
    description: 'تؤجل الشراء وتعطي أهدافك المالية مساحة أقوى.',
  },
}

export const QUESTS = [
  {
    id: 'emergency-buffer',
    title: 'ابنِ هامش أمان',
    description: 'حوّل مبلغاً صغيراً وثابتاً إلى حساب الطوارئ هذا الأسبوع.',
    reward: 'وضوح أكبر قبل الالتزام',
  },
  {
    id: 'payment-check',
    title: 'اختبر القسط',
    description: 'عش شهراً كما لو أن القسط بدأ بالفعل، ثم راقب مرونتك.',
    reward: 'قرار أقرب لواقعك',
  },
] as const

export type QuestId = (typeof QUESTS)[number]['id']
