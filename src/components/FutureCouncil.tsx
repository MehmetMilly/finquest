import { useState } from 'react'
import { MessageCircleMore } from 'lucide-react'
import { FutureAvatar, resolveAvatarMood } from '../avatar'
import { Money } from './Money'
import type { ScenarioResult } from '../types/finance'

const names = {
  finance: 'نسخة الالتزام الأعلى',
  used: 'نسختك المتوازنة',
  delay: 'نسخة المرونة الأكبر',
}

function councilLine(result: ScenarioResult) {
  if (result.id === 'finance') return <>أخذت السيارة اليوم، لكن <Money value={result.averageMonthlyVehicleObligation} /> صار محجوزًا كل شهر.</>
  if (result.id === 'used') return result.monthlyFlexibility >= 0
    ? <>اخترت سيارة تكفيني، وبقي عندي <Money value={result.monthlyFlexibility} /> مساحة للشهر.</>
    : 'اخترت سيارة تكفيني، وخف الضغط كثير—لكن الشهر ما زال يحتاج مساحة إضافية.'
  return 'ما قلت لا؛ قلت مو الآن. سنة واحدة خلت الطريق أخف.'
}

export function FutureCouncil({ results, displayName = 'نسختك' }: { results: ScenarioResult[]; displayName?: string }) {
  const [activeId, setActiveId] = useState<ScenarioResult['id']>('used')
  const active = results.find((item) => item.id === activeId) ?? results[0]
  if (!active) return null

  return (
    <section className="future-council" aria-labelledby="council-title">
      <header><span><MessageCircleMore size={15} /> مجلس المستقبل</span><h2 id="council-title">مسارات <bdi>{displayName}</bdi> المختلفة.</h2></header>
      <div className="future-council__avatars">
        {results.map((result) => (
          <button key={result.id} className={active.id === result.id ? 'is-active' : ''} onClick={() => setActiveId(result.id)} aria-pressed={active.id === result.id}>
            <FutureAvatar mood={resolveAvatarMood({ scenario: result, screen: 'council' })} size="sm" variant="card" />
            <span>{names[result.id]}</span>
          </button>
        ))}
      </div>
      <blockquote><span>“</span>{councilLine(active)}<span>”</span></blockquote>
      <p>كل جملة مبنية على أرقام المسار المختار، وليست توقعًا.</p>
    </section>
  )
}
