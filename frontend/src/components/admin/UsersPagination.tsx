interface UsersPaginationProps {
  page: number
  pages: number
  total: number
  onPageChange: (page: number) => void
}

export function UsersPagination({
  page,
  pages,
  total,
  onPageChange,
}: UsersPaginationProps) {
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      <span className="text-sm text-gray-400">
        Сторінка {page} з {pages} · {total} записів
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-brand-light/50 transition-colors cursor-pointer disabled:cursor-default"
        >
          ← Назад
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-brand-light/50 transition-colors cursor-pointer disabled:cursor-default"
        >
          Далі →
        </button>
      </div>
    </div>
  )
}
