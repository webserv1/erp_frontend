import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Package, Receipt, Store, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { StatCard } from '../../components/cards'
import { Card, useToast } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { dashboardApi, type DashboardData } from '../../services/dashboard.api'

const statCards = [
  { label: 'Products', icon: Package, key: 'totalProducts' as const },
  { label: 'Suppliers', icon: Store, key: 'totalSuppliers' as const },
  { label: 'Total Parties', icon: Users, key: 'totalParties' as const },
  { label: 'Total Sales', icon: ShoppingCart, key: 'totalSales' as const, adminOnly: true },
  { label: "Today's Purchase", icon: Receipt, key: 'todayPurchaseCount' as const },
  { label: "Today's Sales", icon: TrendingUp, key: 'todaySaleCount' as const },
  { label: 'Low Stock Alert', icon: AlertTriangle, key: 'lowStockCount' as const },
  { label: "Today's Profit", icon: TrendingUp, key: 'todaySalesProfit' as const, adminOnly: true },
  { label: 'Total Sales Profit', icon: TrendingUp, key: 'totalSalesProfit' as const, adminOnly: true },
]

export const Dashboard = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const hasWelcomed = useRef(false)
  const [now, setNow] = useState(new Date())
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadDashboard = async () => {
      try {
        const data = await dashboardApi.get()
        if (!cancelled) setDashboard(data)
      } catch (err) {
        if (!cancelled) toast({ title: 'Failed to load dashboard', description: (err as Error).message, variant: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadDashboard()
    return () => { cancelled = true }
  }, [toast])

  useEffect(() => {
    if (!user || hasWelcomed.current) return
    hasWelcomed.current = true
    toast({ title: `Welcome, ${user.name.split(' ')[0]}.`, description: 'Your workspace is ready.', variant: 'info' })
  }, [toast, user])

  const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })

  const isAdmin = user?.role.name === 'ADMIN'
  const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

  const getCardValue = (key: string): number | string => {
    if (!dashboard) return 0
    switch (key) {
      case 'totalProducts':
        return dashboard.totalProducts
      case 'totalSuppliers':
        return dashboard.totalSuppliers
      case 'totalParties':
        return dashboard.totalParties
      case 'totalSales':
        return dashboard.totalSales
      case 'totalSalesProfit':
        return dashboard.totalSalesProfit
      case 'todayPurchaseCount':
        return dashboard.today.purchaseCount
      case 'todaySaleCount':
        return dashboard.today.saleCount
      case 'lowStockCount':
        return dashboard.lowStockAlerts.length
      case 'todaySalesProfit':
        return dashboard.today.salesProfit
      default:
        return 0
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary-dark">ERP OVERVIEW</p>
        <h2 className="mt-1 text-3xl font-bold text-secondary">Good to see you, {user?.name.split(' ')[0]}.</h2>
        <p className="mt-2 text-text-secondary">Your secure workspace is ready.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {statCards
          .filter((card) => !card.adminOnly || isAdmin)
          .map(({ label, icon, key }) => (
            <StatCard
              key={label}
              label={label}
              icon={icon}
              value={loading ? '...' : getCardValue(key)}
            />
          ))}
      </div>

      <Card className="mt-6 w-full max-w-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border-gold px-4 py-3">
          <span className="rounded-lg bg-primary-light p-2 text-primary-dark"><Receipt size={18} /></span>
          <div>
            <h3 className="text-base font-bold text-secondary">Last Party Purchases</h3>
            <p className="text-xs text-text-secondary">Recent purchases by party</p>
          </div>
        </div>
        {loading ? (
          <p className="px-4 py-5 text-sm text-text-secondary">Loading purchases...</p>
        ) : dashboard?.lastPartyPurchases.length ? (
          <div className="divide-y divide-border-gold">
            {dashboard.lastPartyPurchases.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-secondary">{purchase.partyName}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    #{purchase.purchaseNumber} · {new Date(purchase.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-primary-dark">{currency.format(purchase.grandTotal)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-5 text-sm text-text-secondary">No party purchases yet.</p>
        )}
      </Card>

      <div className="fixed bottom-4 right-5 rounded-lg border border-border-gold bg-white/90 px-3 py-1.5 text-right text-xs text-text-secondary shadow-sm backdrop-blur">
        <span className="font-medium text-secondary">{formattedDate}</span>
        <span className="mx-1.5 text-text-secondary">•</span>
        <span className="font-medium text-secondary">{formattedTime}</span>
      </div>
    </>
  )
}
