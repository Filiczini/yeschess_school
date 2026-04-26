import { Link } from 'react-router'

type MobileHeaderProps = {
  backTo?: string
}

export default function MobileHeader({ backTo }: MobileHeaderProps) {
  return (
    <div className="flex items-center gap-3 text-white mb-8">
      {backTo && (
        <Link
          to={backTo}
          className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
        >
          <iconify-icon icon="solar:arrow-left-linear" width="18" height="18"></iconify-icon>
        </Link>
      )}
      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-brand">
        <iconify-icon icon="solar:crown-linear" width="20" height="20"></iconify-icon>
      </div>
      <span className="font-bold tracking-tight text-lg uppercase font-heading">YesChess</span>
    </div>
  )
}
