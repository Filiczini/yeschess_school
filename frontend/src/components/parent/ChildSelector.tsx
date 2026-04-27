interface Child {
  id: string
  name: string
}

interface ChildSelectorProps {
  children: Child[]
  selectedChildId: string | null
  onSelect: (id: string) => void
}

export default function ChildSelector({ children, selectedChildId, onSelect }: ChildSelectorProps) {
  if (children.length <= 1) return null

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
      {children.map(child => (
        <button
          key={child.id}
          onClick={() => onSelect(child.id)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
            selectedChildId === child.id
              ? 'bg-white text-brand border-white'
              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
          }`}
        >
          {child.name}
        </button>
      ))}
    </div>
  )
}
