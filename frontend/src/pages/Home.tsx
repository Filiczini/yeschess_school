import { useState } from 'react'
import { Link } from 'react-router'
import { useSession } from '../lib/auth-client'

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

function LeadModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, comment }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError('Щось пішло не так. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-brand to-brand-dark px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg font-heading">Залишити заявку</h2>
            <p className="text-blue-200 text-sm">Ми зв'яжемось з вами найближчим часом</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24"></iconify-icon>
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <iconify-icon icon="solar:check-circle-linear" width="56" height="56" className="text-green-500 mx-auto mb-4"></iconify-icon>
            <h3 className="text-gray-800 font-bold text-lg mb-2">Заявку отримано!</h3>
            <p className="text-gray-500 text-sm mb-6">Ми зв'яжемось з вами дуже скоро.</p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors"
            >
              Закрити
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">Ім'я</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all text-sm"
                placeholder="Іван Петренко"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">Номер телефону або Telegram</label>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all text-sm"
                placeholder="+38 (098) 000-00-00 або @username"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">
                Коментар
                <span className="ml-1 text-gray-400 font-normal text-xs">(необов'язково)</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all text-sm resize-none"
                placeholder="Хочу записатися на заняття / Яка вартість? / Для дитини 7 років..."
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Відправляємо...' : 'Відправити заявку'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const { data: session } = useSession()
  const [showLead, setShowLead] = useState(false)

  return (
    <div className="bg-gradient-to-br from-brand to-brand-dark text-slate-50 antialiased selection:bg-white selection:text-brand min-h-screen font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      <div className="fixed top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-light rounded-full blur-3xl opacity-50 pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#D4CFEC] rounded-full blur-3xl opacity-20 pointer-events-none z-0" />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 py-24">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="28" height="28"></iconify-icon>
          </div>
          <span className="text-white font-bold tracking-tight text-2xl uppercase font-heading">YesChess</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-[1.1] font-heading max-w-2xl">
          Шахова школа для{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">дітей і дорослих</span>
        </h1>

        <p className="text-base md:text-lg text-blue-100 mb-10 font-medium leading-relaxed max-w-lg mx-auto">
          Онлайн та офлайн заняття у Києві. Досвідчені тренери, системна підготовка, щонедільні турніри.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => setShowLead(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand rounded-2xl font-semibold text-sm hover:bg-blue-50 hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
          >
            <iconify-icon icon="solar:pen-new-square-linear" width="18" height="18"></iconify-icon>
            Залишити заявку
          </button>
          <a
            href="tel:+380980837742"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <iconify-icon icon="solar:phone-linear" width="18" height="18"></iconify-icon>
            +38 (098) 083-77-42
          </a>
          {session ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <iconify-icon icon="solar:user-circle-linear" width="18" height="18"></iconify-icon>
              Мій профіль
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              Увійти
            </Link>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="relative z-10 px-6 pb-24 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white font-heading mb-2">Відгуки</h2>
          <p className="text-blue-200 text-sm">Що кажуть наші учні та батьки</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              name: 'Марія К.',
              avatar: null,
              text: 'Відгуки незабаром — контент у підготовці. Якщо ви вже займались у YesChess, ми будемо раді почути вашу думку!',
              role: 'Учень',
            },
            {
              name: 'Олег Т.',
              avatar: null,
              text: 'Відгуки незабаром — контент у підготовці.',
              role: 'Батько учня',
            },
            {
              name: 'Анна С.',
              avatar: null,
              text: 'Відгуки незабаром — контент у підготовці.',
              role: 'Учень',
            },
          ].map((review, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {review.name[0]}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{review.name}</p>
                  <p className="text-blue-200 text-xs">{review.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <iconify-icon key={s} icon="solar:star-bold" width="14" height="14" className="text-yellow-300"></iconify-icon>
                  ))}
                </div>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">{review.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
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

      {/* Footer */}
      <p className="relative z-10 text-center pb-8 text-blue-200/40 text-xs font-medium">
        &copy; 2026 YesChess School. Київ, Україна.
      </p>

      {/* Floating "Leave a request" button */}
      <button
        type="button"
        onClick={() => setShowLead(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 bg-white text-brand rounded-2xl font-semibold text-sm shadow-xl hover:shadow-2xl hover:bg-blue-50 transition-all duration-300 group"
      >
        <iconify-icon icon="solar:pen-new-square-linear" width="18" height="18"></iconify-icon>
        <span className="hidden sm:inline">Залишити заявку</span>
      </button>

      {showLead && <LeadModal onClose={() => setShowLead(false)} />}
    </div>
  )
}
