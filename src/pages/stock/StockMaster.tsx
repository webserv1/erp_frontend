import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Eye, Pencil, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast, Button, Card, Modal } from '../../components/ui'
import { FormField, Input, Select } from '../../components/forms'
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/table'
import { stockApi } from '../../services/stock.api'
import { productApi } from '../../services/product.api'
import type { Product, Stock } from '../../types/product.types'

type FormState = {
  productId: string
  productCode: string
  productName: string
  sizeId: string
  sizeName: string
  qtyIn: string
  qtyOut: string
  salePrice: string
  remarks: string
  status: boolean
}

const emptyForm: FormState = {
  productId: '',
  productCode: '',
  productName: '',
  sizeId: '',
  sizeName: '',
  qtyIn: '',
  qtyOut: '',
  salePrice: '',
  remarks: '',
  status: true,
}

export const StockMaster = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState<Stock | null>(null)
  const [viewing, setViewing] = useState<Stock | null>(null)

  const [items, setItems] = useState<Stock[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productLookupError, setProductLookupError] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    const loadProducts = async () => {
      try {
        const productsData = await productApi.products.list({ status: true, page: 1, limit: 1000 })
        if (!cancelled) {
          setProducts(productsData.products)
        }
      } catch {
        if (!cancelled) toast({ title: 'Failed to load products', variant: 'error' })
      }
    }
    loadProducts()
    return () => { cancelled = true }
  }, [toast])

  useEffect(() => {
    let cancelled = false
    const loadStock = async () => {
      try {
        const data = await stockApi.list({
          search: search || undefined,
          status: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined,
          page,
          limit,
        })
        if (!cancelled) {
          setItems(data.stock)
          setTotal(data.total)
        }
      } catch (err) {
        if (!cancelled) toast({ title: 'Failed to load stock', description: (err as Error).message, variant: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadStock()
    return () => { cancelled = true }
  }, [search, statusFilter, page, limit, toast])

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
    setProductLookupError('')
  }

  const openCreate = () => {
    resetForm()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (row: Stock) => {
    setEditing(row)
    setForm({
      productId: String(row.productId ?? ''),
      productCode: row.productCode,
      productName: row.productName,
      sizeId: String(row.sizeId),
      sizeName: row.size?.name || `Size #${row.sizeId}`,
      qtyIn: String(row.qtyIn),
      qtyOut: String(row.qtyOut),
      salePrice: String(row.salePrice),
      remarks: row.remarks || '',
      status: row.status,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openView = (row: Stock) => {
    setViewing(row)
  }

  const handleProductChange = (productId: string) => {
    setProductLookupError('')
    const product = products.find((p) => String(p.id) === productId)
    if (product) {
      setForm((current) => ({
        ...current,
        productId,
        productCode: product.productCode,
        productName: product.productName,
        sizeId: String(product.sizeId),
        sizeName: product.size?.name || `Size #${product.sizeId}`,
      }))
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const payload = {
        productCode: form.productCode,
        productName: form.productName,
        sizeId: Number(form.sizeId),
        qtyIn: Number(form.qtyIn),
        qtyOut: Number(form.qtyOut),
        salePrice: Number(form.salePrice),
        remarks: form.remarks || undefined,
        status: form.status,
      }

      if (editing) {
        await stockApi.update(editing.id, payload)
        toast({ title: 'Stock updated', variant: 'success' })
      } else {
        await stockApi.create(payload)
        toast({ title: 'Stock created', variant: 'success' })
      }
      resetForm()
      setPage(1)
      const data = await stockApi.list({ search: search || undefined, status: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined, page: 1, limit })
      setItems(data.stock)
      setTotal(data.total)
    } catch (err) {
      toast({ title: editing ? 'Update failed' : 'Creation failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const remove = async (row: Stock) => {
    try {
      await stockApi.remove(row.id)
      toast({ title: 'Stock deleted', variant: 'success' })
      const data = await stockApi.list({ search: search || undefined, status: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined, page: page > 1 ? page - 1 : 1, limit })
      setItems(data.stock)
      setTotal(data.total)
      setPage(data.page || 1)
    } catch (err) {
      toast({ title: 'Delete failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginatedItems = items.slice((page - 1) * limit, page * limit)

  const columns: DataTableColumn<Stock>[] = [
    { key: 'productCode', header: 'Product Code', width: '120px' },
    { key: 'productName', header: 'Product Name' },
    {
      key: 'size',
      header: 'Size',
      cell: (row) => row.size?.name || '—',
    },
    { key: 'qtyIn', header: 'Qty In', width: '80px' },
    { key: 'qtyOut', header: 'Qty Out', width: '80px' },
    { key: 'balanceStock', header: 'Balance Stock', width: '120px' },
    { key: 'salePrice', header: 'Sale Price', width: '120px', cell: (row) => `₹${row.salePrice}` },
    { key: 'saleValue', header: 'Sale Value', width: '120px', cell: (row) => `₹${row.saleValue}` },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      cell: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {row.status ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  const actions: DataTableAction<Stock>[] = [
    { label: <Eye size={16} />, onClick: openView, title: 'View' },
    { label: <Pencil size={16} />, onClick: openEdit, title: 'Edit' },
    { label: <Trash2 size={16} />, onClick: remove, className: 'text-red-600 hover:bg-red-50', title: 'Delete' },
  ]

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft size={18} /></Button>
          <div>
            <p className="text-sm font-semibold text-primary-dark">STOCK</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">All Stock</h2>
          </div>
        </div>
        <Button onClick={openCreate}>+ Add Stock</Button>
      </div>

      <Card className="mb-6 p-6">
        <form id="stock-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Product Code" required error={productLookupError}>
              <Select required value={form.productId} onChange={(e) => handleProductChange(e.target.value)}>
                <option value="">Select product code</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.productCode}</option>)}
              </Select>
            </FormField>
            <FormField label="Product Name" required><Input required value={form.productName} readOnly placeholder="Auto-filled from product code" /></FormField>
            <FormField label="Size" required><Input required value={form.sizeName} readOnly placeholder="Auto-filled from product code" /></FormField>
            <FormField label="Qty In" required><Input required type="number" min="0" value={form.qtyIn} onChange={(e) => setForm({ ...form, qtyIn: e.target.value })} /></FormField>
            <FormField label="Qty Out" required><Input required type="number" min="0" value={form.qtyOut} onChange={(e) => setForm({ ...form, qtyOut: e.target.value })} /></FormField>
            <FormField label="Sale Price" required><Input required type="number" min="0" step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} /></FormField>
            <FormField label="Remarks"><Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></FormField>
            <FormField label="Status">
              <Select value={form.status ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value === 'ACTIVE' })}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </FormField>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
            <Button type="submit" loading={loading}>{editing ? 'Update Stock' : 'Submit Stock'}</Button>
          </div>
        </form>
      </Card>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Search by product name or product code"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="sm:max-w-40">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={paginatedItems}
        rowKey={(row) => row.id}
        actions={actions}
        loading={loading}
        emptyMessage="No stock entries found."
        pagination={{
          page,
          totalPages,
          total,
          limit,
          onPageChange: setPage,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1) },
        }}
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Stock Details" footer={<Button variant="outline" onClick={() => setViewing(null)}>Close</Button>}>
        {viewing && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border-gold">
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Product Code</td><td className="px-4 py-2 text-secondary">{viewing.productCode}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Product Name</td><td className="px-4 py-2 text-secondary">{viewing.productName}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Size</td><td className="px-4 py-2 text-secondary">{viewing.size?.name || '—'}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Qty In</td><td className="px-4 py-2 text-secondary">{viewing.qtyIn}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Qty Out</td><td className="px-4 py-2 text-secondary">{viewing.qtyOut}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Balance Stock</td><td className="px-4 py-2 text-secondary">{viewing.balanceStock}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Sale Price</td><td className="px-4 py-2 text-secondary">₹{viewing.salePrice}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Sale Value</td><td className="px-4 py-2 text-secondary">₹{viewing.saleValue}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Remarks</td><td className="px-4 py-2 text-secondary">{viewing.remarks || '—'}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Status</td><td className="px-4 py-2 text-secondary">{viewing.status ? 'Active' : 'Inactive'}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  )
}
