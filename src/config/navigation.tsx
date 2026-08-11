import { Boxes, LayoutDashboard, Receipt, Truck, ShoppingCart, Users, Warehouse, Wallet, BarChart3, Settings } from 'lucide-react'
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
  { label: 'Purchase Master', path: '/purchases', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Sales', path: '/sales', icon: Receipt, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Stock', path: '/stock', icon: Warehouse, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Expenses', path: '/expenses', icon: Wallet, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER'] },
]
