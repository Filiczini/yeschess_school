import { useState } from 'react'

const FAQ_ITEMS = [
  {
    q: 'Яка вартість занять (групових та індивідуальних)?',
    a: 'Вартість занять залежить від формату та тренера. Зв\'яжіться з нами для отримання актуального прайс-листу.',
  },
  {
    q: 'Чи є пробний урок?',
    a: 'Так! Ми пропонуємо безкоштовний пробний урок, щоб ви могли познайомитись з тренером та форматом навчання.',
  },
  {
    q: 'З якого віку можна починати?',
    a: 'Ми приймаємо дітей від 5 років. Шахи розвивають логіку, увагу та посидючість з раннього віку.',
  },
  {
    q: 'Заняття проходять онлайн чи офлайн?',
    a: 'Ми проводимо заняття в обох форматах — онлайн (через Zoom/Google Meet) та офлайн у Києві.',
  },
  {
    q: 'Чи можна займатись дорослим?',
    a: 'Звичайно! У нас займаються учні будь-якого віку — від дошкільнят до дорослих.Ніколи не пізно вивчити шахи.',
  },
  {
    q: 'Що ви даєте, окрім занять?',
    a: null, // special item rendered separately
  },
]

const EXTRAS = [
  { icon: 'solar:chat-round-dots-linear', text: 'Підтримка учнів та батьків 24/7' },
  { icon: 'solar:cup-star-linear', text: 'Щонедільні тренувальні турніри' },
  { icon: 'solar:notebook-linear', text: 'Домашні завдання відповідно до рівня учня' },
  { icon: 'solar:users-group-rounded-linear', text: 'Участь в офлайн-подіях школи' },
  { icon: 'solar:sun-linear', text: 'Літні табори' },
  { icon: 'solar:bus-linear', text: 'Поїздки на турніри разом з командою учнів та батьків' },
  { icon: 'solar:planet-linear', text: 'Можливість участі у міжнародних шахових подіях / поїздках за кордон' },
  { icon: 'solar:brain-linear', text: 'Глибока системна підготовка та розвиток мислення' },
]

function FaqItem({ q, a, extra }: { q: string; a: string | null; extra?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-medium text-sm md:text-base">{q}</span>
        <iconify-icon
          icon={open ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
          width="20"
          height="20"
          className="shrink-0 text-blue-200"
        ></iconify-icon>
      </button>
      {open && (
        <div className="px-6 pb-5">
          {extra ? (
            <ul className="space-y-2 mt-1">
              {EXTRAS.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-blue-100 text-sm">
                  <iconify-icon icon={item.icon} width="18" height="18" className="shrink-0 mt-0.5 text-blue-200"></iconify-icon>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-blue-100 text-sm leading-relaxed">{a}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function FaqSection() {
  return (
    <section className="relative z-10 px-6 pb-28 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white font-heading mb-2">Часті запитання</h2>
        <p className="text-blue-200 text-sm">Відповіді на найпоширеніші питання</p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem
            key={i}
            q={item.q}
            a={item.a}
            extra={item.a === null}
          />
        ))}
      </div>
    </section>
  )
}
