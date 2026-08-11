import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useToast, Button, Card } from '../../components/ui'
import { reportApi } from '../../services/report.api'
import type { Report } from '../../types/product.types'

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const SalesTrendChart = ({ data }: { data: Report['data']['salesTrend'] }) => {
  if (!data || data.length === 0) return <p className="text-sm text-text-secondary">No trend data available.</p>

  const maxValue = Math.max(...data.flatMap((d) => [d.sales, d.profit]), 1)
  const width = 800
  const height = 250
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const getX = (index: number) => padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth
  const getY = (value: number, max: number) => padding.top + chartHeight - (value / max) * chartHeight

  const salesPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.sales, maxValue)}`).join(' ')
  const profitPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.profit, maxValue)}`).join(' ')
  const labelStep = Math.max(1, Math.ceil(data.length / 8))

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]">
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#e5e7eb" strokeWidth="1" />
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <g key={tick}>
            <line x1={padding.left} y1={padding.top + chartHeight * (1 - tick)} x2={width - padding.right} y2={padding.top + chartHeight * (1 - tick)} stroke="#f3f4f6" strokeWidth="1" />
            <text x={padding.left - 8} y={padding.top + chartHeight * (1 - tick) + 4} textAnchor="end" className="text-xs fill-text-secondary">
              {Math.round(maxValue * tick)}
            </text>
          </g>
        ))}
        <path d={salesPath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={profitPath} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" />
        {data.map((d, i) => (
          <circle key={i} cx={getX(i)} cy={getY(d.sales, maxValue)} r="4" fill="#2563eb" />
        ))}
        {data.map((d, i) => (
          <circle key={i} cx={getX(i)} cy={getY(d.profit, maxValue)} r="4" fill="#16a34a" />
        ))}
        {data.map((d, i) => (i % labelStep === 0 || i === data.length - 1) && (
          <text key={i} x={getX(i)} y={height - padding.bottom + 20} textAnchor="middle" className="text-xs fill-text-secondary">
            {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </text>
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="h-3 w-3 rounded-full bg-blue-600" />
          Sales
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="h-3 w-3 rounded-full bg-green-600" style={{ border: '2px dashed #16a34a' }} />
          Profit
        </div>
      </div>
    </div>
  )
}

export const ReportDetail = () => {
  const { id } = useParams()
  const { toast } = useToast()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadReport = async () => {
      if (!id) return
      try {
        const data = await reportApi.get(Number(id))
        if (!cancelled) setReport(data)
      } catch (err) {
        if (!cancelled) toast({ title: 'Failed to load report', description: (err as Error).message, variant: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadReport()
    return () => { cancelled = true }
  }, [id, toast])

  if (loading) return <div className="text-center text-text-secondary">Loading report...</div>
  if (!report) return <div className="text-center text-text-secondary">Report not found.</div>

  const data = report.data

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => window.history.back()}><ArrowLeft size={18} /></Button>
          <div>
            <p className="text-sm font-semibold text-primary-dark">REPORT DETAILS</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">
              {report.type} Report
            </h2>
            <p className="text-sm text-text-secondary">
              {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <p className="text-sm text-text-secondary">Total Sales</p>
          <p className="mt-1 text-2xl font-bold text-secondary">{formatCurrency(data.sales.total)}</p>
          <p className="text-xs text-text-secondary">{data.sales.count} orders</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary">Purchases</p>
          <p className="mt-1 text-2xl font-bold text-secondary">{formatCurrency(data.purchases.total)}</p>
          <p className="text-xs text-text-secondary">{data.purchases.count} orders</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary">Expenses</p>
          <p className="mt-1 text-2xl font-bold text-secondary">{formatCurrency(data.expenses.total)}</p>
          <p className="text-xs text-text-secondary">{data.expenses.count} records</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary">Net Profit</p>
          <p className={`mt-1 text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(data.netProfit)}</p>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h3 className="mb-4 text-lg font-semibold text-secondary">Sales & Profit Overview</h3>
        <SalesTrendChart data={data.salesTrend} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-secondary">Top Products</h3>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-text-secondary">No top products.</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-border-gold p-3">
                  <div>
                    <p className="text-sm font-medium text-secondary">{product.productName}</p>
                    <p className="text-xs text-text-secondary">{product.productCode} • Qty: {product.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-secondary">{formatCurrency(product.total)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-secondary">Top Parties</h3>
          {data.topParties.length === 0 ? (
            <p className="text-sm text-text-secondary">No top parties.</p>
          ) : (
            <div className="space-y-3">
              {data.topParties.map((party, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-border-gold p-3">
                  <div>
                    <p className="text-sm font-medium text-secondary">{party.partyName}</p>
                    <p className="text-xs text-text-secondary">Party ID: {party.partyId}</p>
                  </div>
                  <p className="text-sm font-semibold text-secondary">{formatCurrency(party.total)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-secondary">Low Stock Alerts</h3>
          {data.lowStockAlerts.length === 0 ? (
            <p className="text-sm text-text-secondary">No low stock alerts.</p>
          ) : (
            <div className="space-y-3">
              {data.lowStockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between rounded-lg border border-border-gold p-3">
                  <div>
                    <p className="text-sm font-medium text-secondary">{alert.productName}</p>
                    <p className="text-xs text-text-secondary">{alert.productCode}</p>
                  </div>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">{alert.balanceStock} left</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
