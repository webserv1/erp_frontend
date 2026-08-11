import { useEffect, useState } from 'react'
import { ArrowLeft, Eye, Filter, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast, Button, Card, Modal } from '../../components/ui'
import { FormField, Select } from '../../components/forms'
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/table'
import { reportApi } from '../../services/report.api'
import type { Report, ReportData } from '../../types/product.types'
import { useAuth } from '../../hooks/useAuth'

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const SalesTrendChart = ({ data, showProfit }: { data: ReportData['salesTrend']; showProfit: boolean }) => {
  if (!data || data.length === 0) return <p className="text-sm text-text-secondary">No trend data available.</p>

  const maxValue = Math.max(...data.flatMap((d) => showProfit ? [d.sales, d.profit] : [d.sales]), 1)
  const width = 800
  const height = 250
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const getX = (index: number) => padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth
  const getY = (value: number, max: number) => padding.top + chartHeight - (value / max) * chartHeight

  const salesPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.sales, maxValue)}`).join(' ')
  const profitPath = showProfit ? data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.profit, maxValue)}`).join(' ') : ''
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
        {showProfit && <path d={profitPath} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" />}
        {data.map((d, i) => (
          <circle key={i} cx={getX(i)} cy={getY(d.sales, maxValue)} r="4" fill="#2563eb" />
        ))}
        {showProfit && data.map((d, i) => (
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
        {showProfit && <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="h-3 w-3 rounded-full bg-green-600" style={{ border: '2px dashed #16a34a' }} />
          Profit
        </div>}
      </div>
    </div>
  )
}

export const Reports = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [generateType, setGenerateType] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY')
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = user?.role.name === 'ADMIN'
  const canManage = user?.role.name === 'ADMIN' || user?.role.name === 'MANAGER'

  const loadReports = async () => {
    let cancelled = false
    try {
      const data = await reportApi.list(typeFilter ? { type: typeFilter as 'WEEKLY' | 'MONTHLY' } : undefined)
      if (!cancelled) setReports(data.reports)
    } catch (err) {
      toast({ title: 'Failed to load reports', description: (err as Error).message, variant: 'error' })
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [typeFilter, toast])

  const openGenerateModal = () => {
    setGenerateType('WEEKLY')
    setGenerateModalOpen(true)
  }

  const handleTypeChange = (value: string) => {
    if (value === 'WEEKLY' || value === 'MONTHLY') {
      setGenerateType(value)
    }
  }

  const handleGenerate = async () => {
    setSubmitting(true)
    try {
      const res = await reportApi.generate({ type: generateType })
      toast({ title: res.message, variant: 'success' })
      setGenerateModalOpen(false)
      await loadReports()
    } catch (err) {
      toast({ title: 'Failed to generate report', description: (err as Error).message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const openView = async (report: Report) => {
    try {
      const fullReport = await reportApi.get(report.id)
      setSelectedReport(fullReport)
    } catch (err) {
      toast({ title: 'Failed to load report details', description: (err as Error).message, variant: 'error' })
    }
  }

  const columns: DataTableColumn<Report>[] = [
    {
      key: 'type',
      header: 'Type',
      width: '120px',
      cell: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.type === 'WEEKLY' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
          {row.type}
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      cell: (row) => `${formatDate(row.periodStart)} - ${formatDate(row.periodEnd)}`,
    },
    {
      key: 'generatedBy',
      header: 'Generated By',
      cell: (row) => row.generatedBy?.name || '—',
    },
    {
      key: 'createdAt',
      header: 'Created At',
      width: '150px',
      cell: (row) => formatDate(row.createdAt),
    },
  ]

  const actions: DataTableAction<Report>[] = [
    { label: <Eye size={16} />, onClick: openView, title: 'View' },
  ]

  const renderReportDetails = (report: Report) => {
    const data = report.data
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-text-secondary">Total Sales</p>
            <p className="mt-1 text-xl font-bold text-secondary">{formatCurrency(data.sales.total)}</p>
            <p className="text-xs text-text-secondary">{data.sales.count} orders</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-secondary">Purchases</p>
            <p className="mt-1 text-xl font-bold text-secondary">{formatCurrency(data.purchases.total)}</p>
            <p className="text-xs text-text-secondary">{data.purchases.count} orders</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-secondary">Expenses</p>
            <p className="mt-1 text-xl font-bold text-secondary">{formatCurrency(data.expenses.total)}</p>
            <p className="text-xs text-text-secondary">{data.expenses.count} records</p>
          </Card>
          {isAdmin && <Card className="p-4">
            <p className="text-sm text-text-secondary">Net Profit</p>
            <p className={`mt-1 text-xl font-bold ${data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(data.netProfit)}</p>
          </Card>}
        </div>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-secondary">{isAdmin ? 'Sales & Profit Overview' : 'Sales Overview'}</h3>
          <SalesTrendChart data={data.salesTrend} showProfit={isAdmin} />
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
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
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft size={18} /></Button>
          <div>
            <p className="text-sm font-semibold text-primary-dark">REPORTS</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">Analytics Dashboard</h2>
            <p className="text-sm text-text-secondary">Generate and view weekly/monthly business reports</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openGenerateModal}>
            <Plus size={18} className="mr-2" />
            Generate Report
          </Button>
        )}
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-text-secondary" />
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="sm:max-w-40">
              <option value="">All Types</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </Select>
          </div>
        </div>
      </Card>

      {selectedReport && (
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-secondary">
                {selectedReport.type} Report - {formatDate(selectedReport.periodStart)} to {formatDate(selectedReport.periodEnd)}
              </h3>
              <p className="text-sm text-text-secondary">Generated by {selectedReport.generatedBy?.name || '—'} on {formatDate(selectedReport.createdAt)}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
          </div>
          {renderReportDetails(selectedReport)}
        </Card>
      )}

      <DataTable
        columns={columns}
        rows={reports}
        rowKey={(row) => row.id}
        actions={actions}
        loading={loading}
        emptyMessage="No reports found. Generate your first report."
        pagination={{
          page: 1,
          totalPages: 1,
          total: reports.length,
          limit: reports.length,
          onPageChange: () => {},
          onLimitChange: () => {},
        }}
      />

      <Modal open={generateModalOpen} onClose={() => setGenerateModalOpen(false)} title="Generate Report" footer={<Button variant="outline" onClick={() => setGenerateModalOpen(false)}>Cancel</Button>}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Select the report type to generate.</p>
          <FormField label="Report Type" required>
            <Select required value={generateType} onChange={(e) => handleTypeChange(e.target.value)}>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </Select>
          </FormField>
          <div className="flex justify-end">
            <Button onClick={handleGenerate} loading={submitting}>Generate</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
