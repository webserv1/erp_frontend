export type UserRole = 'ADMIN' | 'MANAGER' | 'WORKER'

export interface Role { id: number; name: UserRole }
export interface Company { id: number; name: string }

export interface AuthUser {
  id: number
  companyId: number
  roleId: number
  name: string
  email: string
  status: boolean
  role: Role
  company?: Company
  photoUrl?: string
}

export interface LoginResponse { message: string; token: string; user: AuthUser }

export interface ApiError { message: string; details?: { fields?: string[] } }
