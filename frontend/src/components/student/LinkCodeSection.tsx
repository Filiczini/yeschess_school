interface LinkCodeSectionProps {
  code?: { code: string; expiresAt: string } | null
  loading: boolean
  onGenerate: () => void
}

export default function LinkCodeSection({ code, loading, onGenerate }: LinkCodeSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4 text-white">
      <h2 className="text-sm font-semibold text-blue-200 mb-3">Прив'язка до батька</h2>
      {code ? (
        <div>
          <p className="text-xs text-blue-200 mb-3">
            Передайте цей код батьку — він вводить його у своєму акаунті.
            Діє до {new Date(code.expiresAt).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center">
              <span className="text-2xl font-bold tracking-[0.3em] font-heading">{code.code}</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(code.code)}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
              title="Скопіювати"
            >
              <iconify-icon icon="solar:copy-linear" width="18" height="18"></iconify-icon>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onGenerate}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors disabled:opacity-50"
        >
          <iconify-icon icon="solar:link-bold-duotone" width="18" height="18"></iconify-icon>
          {loading ? 'Генерація...' : 'Отримати код прив\'язки'}
        </button>
      )}
    </div>
  )
}
