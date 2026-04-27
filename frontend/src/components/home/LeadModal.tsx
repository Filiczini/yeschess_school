import { useState } from 'react'

interface LeadModalProps {
  onClose: () => void
}

export default function LeadModal({ onClose }: LeadModalProps) {
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
