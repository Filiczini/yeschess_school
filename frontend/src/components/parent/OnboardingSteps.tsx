import { Link } from 'react-router'
import GlassCard from '../GlassCard'

export default function OnboardingSteps() {
  return (
    <GlassCard className="p-5 mb-4 text-white">
      <div className="flex items-center gap-2 mb-4">
        <iconify-icon icon="solar:rocket-bold-duotone" width="20" height="20" className="text-amber-300"></iconify-icon>
        <span className="font-semibold text-sm">Як почати навчання</span>
      </div>
      <div className="space-y-3">
        {[
          {
            num: '1',
            title: 'Додайте дитину',
            desc: 'Створіть акаунт для вашої дитини',
            action: { label: 'Додати зараз', to: '/parent/add-child' },
            color: 'bg-violet-400/20 border-violet-400/30 text-violet-300',
          },
          {
            num: '2',
            title: 'Дочекайтесь призначення тренера',
            desc: 'Адміністратор призначить тренера найближчим часом',
            action: null,
            color: 'bg-blue-400/20 border-blue-400/30 text-blue-300',
          },
          {
            num: '3',
            title: 'Запишіть дитину на заняття',
            desc: 'Оберіть зручний час у розкладі тренера',
            action: null,
            color: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300',
          },
        ].map(step => (
          <div key={step.num} className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${step.color}`}>
              {step.num}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-xs text-blue-200 mt-0.5">{step.desc}</div>
              {step.action && (
                <Link
                  to={step.action.to}
                  className="inline-block mt-1.5 text-xs text-white underline underline-offset-2"
                >
                  {step.action.label} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
