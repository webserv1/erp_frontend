import { Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export const AppHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user, lastLogoutAt } = useAuth()
  const isSqarsGarments = user?.company?.name.trim().toLocaleLowerCase() === 'sqars garments'
  const formatLogoutTime = (iso?: string | null) => {
    if (!iso) return 'Never'
    const date = new Date(iso)
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  }

  return <header className="flex h-18 items-center justify-between border-b border-slate-100 bg-white px-5 lg:px-8"><button onClick={onMenuClick} className="rounded-lg p-2 text-secondary hover:bg-amber-50 lg:hidden"><Menu /></button><div className="hidden items-center gap-3 lg:flex">{isSqarsGarments && <img src="/sqars-logo.png.jpeg" alt="SQARS Garments" className="size-11 rounded-full border border-primary/50 object-cover shadow-sm" />}<div><p className="text-sm text-text-secondary">Welcome back</p><h1 className="font-bold text-secondary">{user?.company?.name ?? 'Your company'}</h1></div></div><div className="ml-auto"><div className="text-right"><div className="flex items-center justify-end gap-2"><p className="text-sm font-semibold">{user?.name}</p><span className="size-2 rounded-full bg-green-500" title="Online" /></div><p className="text-xs text-primary-dark">{user?.role.name}</p>{lastLogoutAt && <p className="text-[10px] text-text-secondary">Last logout: {formatLogoutTime(lastLogoutAt)}</p>}</div></div></header>
}
