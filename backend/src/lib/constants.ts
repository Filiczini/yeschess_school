export const ROLES = {
  STUDENT: 'student',
  PARENT: 'parent',
  COACH: 'coach',
  SCHOOL_OWNER: 'school_owner',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN] as const
export const SELF_ASSIGNABLE_ROLES = [ROLES.STUDENT, ROLES.PARENT, ROLES.COACH] as const

export const STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const
