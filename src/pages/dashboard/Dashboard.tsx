import { useEffect, useRef, useState } from 'react'
import { Building2, ShieldCheck, Users } from 'lucide-react'
import { StatCard } from '../../components/cards'
import { useToast } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

const cards = [{ label: 'Company', icon: Building2, value: 'Active workspace' }, { label: 'Your role', icon: ShieldCheck, value: 'Access granted' }, { label: 'Team', icon: Users, value: 'Manage securely' }]

export const Dashboard = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const hasWelcomed = useRef(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getValue = (label: string, fallback: string) => {
    if (label === 'Company') return user?.company?.name ?? fallback
    if (label === 'Your role') return user?.role.name ?? fallback
    return fallback
  }

  useEffect(() => {
    if (!user || hasWelcomed.current) return
    hasWelcomed.current = true
    toast({ title: `Welcome, ${user.name.split(' ')[0]}.`, description: 'Your workspace is ready.', variant: 'info' })
  }, [toast, user])

  const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary-dark">ERP OVERVIEW</p>
        <h2 className="mt-1 text-3xl font-bold text-secondary">Good to see you, {user?.name.split(' ')[0]}.</h2>
        <p className="mt-2 text-text-secondary">Your secure workspace is ready.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map(({ label, icon, value }) => (
          <StatCard key={label} label={label} icon={icon} value={getValue(label, value)} />
        ))}
      </div>

      <div className="fixed bottom-4 right-5 rounded-lg border border-border-gold bg-white/90 px-3 py-1.5 text-right text-xs text-text-secondary shadow-sm backdrop-blur">
        <span className="font-medium text-secondary">{formattedDate}</span>
        <span className="mx-1.5 text-text-secondary">•</span>
        <span className="font-medium text-secondary">{formattedTime}</span>
      </div>
    </>
  )
}
