type BadgeProps = {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={`text-xs px-2.5 py-1 border font-medium ${className ?? ''}`}>
      {children}
    </span>
  )
}

const ROLE_LABELS: Record<string, string> = {
  student: 'Учень',
  parent: 'Батько/Мати',
  coach: 'Тренер',
  school_owner: 'Власник',
  admin: 'Адмін',
  super_admin: 'Супер адмін',
}

const ROLE_COLORS: Record<string, string> = {
  student: 'text-blue-700 bg-blue-50 border-blue-200',
  parent: 'text-purple-700 bg-purple-50 border-purple-200',
  coach: 'text-amber-700 bg-amber-50 border-amber-200',
  school_owner: 'text-orange-700 bg-orange-50 border-orange-200',
  admin: 'text-red-700 bg-red-50 border-red-200',
  super_admin: 'text-pink-700 bg-pink-50 border-pink-200',
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <Badge className={`rounded-md ${ROLE_COLORS[role] ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  )
}

const STATUS_LABELS_LIGHT: Record<string, string> = {
  active: 'Активний',
  pending: 'На розгляді',
  suspended: 'Заблокований',
}

const STATUS_COLORS_LIGHT: Record<string, string> = {
  active: 'text-green-700 bg-green-50 border-green-200',
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  suspended: 'text-red-700 bg-red-50 border-red-200',
}

const STATUS_LABELS_DARK: Record<string, string> = {
  pending: 'Очікує',
  confirmed: 'Підтверджено',
  completed: 'Завершено',
  cancelled: 'Скасовано',
}

const STATUS_COLORS_DARK: Record<string, string> = {
  pending: 'bg-yellow-400/20 border-yellow-400/30 text-yellow-300',
  confirmed: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300',
  completed: 'bg-blue-400/20 border-blue-400/30 text-blue-300',
  cancelled: 'bg-red-400/20 border-red-400/30 text-red-300',
}

export function StatusBadge({ status, variant = 'light' }: { status: string; variant?: 'light' | 'dark' }) {
  if (variant === 'dark') {
    return (
      <Badge className={`rounded-full ${STATUS_COLORS_DARK[status] ?? 'bg-white/10 border-white/20 text-blue-100'}`}>
        {STATUS_LABELS_DARK[status] ?? status}
      </Badge>
    )
  }
  return (
    <Badge className={`rounded-md ${STATUS_COLORS_LIGHT[status] ?? ''}`}>
      {STATUS_LABELS_LIGHT[status] ?? status}
    </Badge>
  )
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Початківець',
  intermediate: 'Середній',
  advanced: 'Просунутий',
}

const LEVEL_COLORS_DARK: Record<string, string> = {
  beginner: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300',
  intermediate: 'bg-blue-400/20 border-blue-400/30 text-blue-300',
  advanced: 'bg-purple-400/20 border-purple-400/30 text-purple-300',
}

export function LevelBadge({ level }: { level: string }) {
  return (
    <Badge className={`rounded-full ${LEVEL_COLORS_DARK[level] ?? 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300'}`}>
      {LEVEL_LABELS[level] ?? level}
    </Badge>
  )
}
