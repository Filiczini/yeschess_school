import GlassCard from '../GlassCard'

const REVIEWS = [
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
]

export default function ReviewsSection() {
  return (
    <section className="relative z-10 px-6 pb-24 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white font-heading mb-2">Відгуки</h2>
        <p className="text-blue-200 text-sm">Що кажуть наші учні та батьки</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {REVIEWS.map((review, i) => (
          <GlassCard key={i} className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {review.name[0]}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{review.name}</p>
                <p className="text-blue-200 text-xs">{review.role}</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <iconify-icon key={s} icon="solar:star-bold" width="14" height="14" className="text-yellow-300"></iconify-icon>
                ))}
              </div>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed">{review.text}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  )
}
