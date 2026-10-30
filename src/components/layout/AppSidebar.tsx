import { Building2, ChevronDown, LogOut, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { APP_NAVIGATION, type NavigationItem } from '../../config/navigation'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../ui'

export const AppSidebar = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const [expanded, setExpanded] = useState<string[]>([])

  const toggleExpand = (label: string) => {
    setExpanded((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]))
  }

  const visibleItems = APP_NAVIGATION.filter((item) => user && item.roles.includes(user.role.name))

  const signOut = async () => {
    try {
      await logout()
      toast({ title: 'Signed out', description: 'You have been signed out successfully.', variant: 'success' })
    } catch {
      toast({ title: 'Signed out locally', description: 'The server could not be reached, but your session was cleared.', variant: 'info' })
    } finally {
      onClose()
    }
  }

  const renderItem = (item: NavigationItem) => {
    const isActive = item.path ? location.pathname === item.path || location.pathname.startsWith(`${item.path}/`) : false
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expanded.includes(item.label)

    if (hasChildren) {
      const childVisible = item.children!.filter((child) => user && child.roles.includes(user.role.name))
      if (childVisible.length === 0) return null

      return (
        <div key={item.label} className="space-y-1">
          <button
            type="button"
            onClick={() => toggleExpand(item.label)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition ${isActive || childVisible.some((child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)) ? 'bg-primary text-secondary' : 'text-white hover:bg-sidebar-hover'}`}
          >
            <span className="flex items-center gap-3">
              {item.icon && <item.icon size={19} />}
              {item.label}
            </span>
            <ChevronDown size={16} className={`transition ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isExpanded && <div className="ml-4 space-y-1 border-l border-white/10 pl-3">{childVisible.map((child) => renderItem(child))}</div>}
        </div>
      )
    }

    return (
      <NavLink
        key={item.path}
        to={item.path!}
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-primary text-secondary' : 'text-white hover:bg-sidebar-hover'}`
        }
      >
        {item.icon && <item.icon size={19} />}
        {item.label}
      </NavLink>
    )
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-68 flex-col overflow-hidden bg-sidebar text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-18 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-secondary"><Building2 size={20} /></div>
          <div><p className="font-bold">A-ERP</p><p className="text-xs text-white/60">Operations suite</p></div>
        </div>
        <button onClick={onClose} className="lg:hidden"><X /></button>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">{visibleItems.map((item) => renderItem(item))}</nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white transition hover:bg-sidebar-hover">
          <LogOut size={19} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
