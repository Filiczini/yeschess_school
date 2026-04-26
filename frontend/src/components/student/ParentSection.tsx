interface ParentSectionProps {
  parent?: { name: string; email: string; phone?: string | null; contactMethod?: string | null } | null
}

export default function ParentSection({ parent }: ParentSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4 text-white">
      <h2 className="text-sm font-semibold text-blue-200 mb-3">Батько/Мати</h2>
      {parent ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <iconify-icon icon="solar:users-group-rounded-bold-duotone" width="20" height="20"></iconify-icon>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">{parent.name}</div>
            <div className="text-xs text-blue-200 truncate">{parent.email}</div>
            {parent.phone && (
              <div className="text-xs text-blue-300 mt-0.5 flex items-center gap-1">
                <iconify-icon icon="solar:phone-linear" width="12" height="12"></iconify-icon>
                {parent.phone}
                {parent.contactMethod && <span className="capitalize">· {parent.contactMethod}</span>}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-blue-300">Батька не прив'язано</div>
      )}
    </div>
  )
}
