import { Boxes, LayoutDashboard, Users, Truck } from 'lucide-react'
import type { UserRole } from '../types/auth.types'

export type NavigationItem = {
  label: string
  path?: string
  icon?: typeof LayoutDashboard
  roles: UserRole[]
  children?: NavigationItem[]
}

export const APP_NAVIGATION: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'WORKER'] },
  {
    label: 'Product Management',
    path: '/products',
    icon: Boxes,
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Products', path: '/products', roles: ['ADMIN', 'MANAGER'] },
      { label: 'Product Masters', path: '/product-masters', roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  { label: 'Party Master', path: '/parties', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Supplier Master', path: '/suppliers', icon: Truck, roles: ['ADMIN', 'MANAGER'] },
]
