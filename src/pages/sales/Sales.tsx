import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Eye, Pencil, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast, Button, Card, Modal } from '../../components/ui'
import { FormField, Input, Select } from '../../components/forms'
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/table'
import { saleApi } from '../../services/sale.api'
import { supplierApi } from '../../services/supplier.api'
import { productApi } from '../../services/product.api'
import { partyApi } from '../../services/party.api'
import type { Product, Sale, Supplier, Party } from '../../types/product.types'

type UnitType = 'PIECES' | 'DOZEN'

type FormState = {
  productId: string
  productCode: string
  productName: string
  partyId: string
  partyName: string
  supplierId: string
  supplierName: string
  supplierMobile: string
  supplierEmail: string
  supplierAddress: string
  sizeId: string
  colorId: string
  sizeName: string
  colorName: string
  quantity: string
  unit: UnitType
  salePrice: string
  purchasePrice: string
  status: boolean
}

const emptyForm: FormState = {
  productId: '',
  productCode: '',
  productName: '',
  partyId: '',
  partyName: '',
  supplierId: '',
  supplierName: '',
  supplierMobile: '',
  supplierEmail: '',
  supplierAddress: '',
  sizeId: '',
  colorId: '',
  sizeName: '',
  colorName: '',
  quantity: '',
  unit: 'PIECES',
  salePrice: '',
  purchasePrice: '',
  status: true,
}

export const Sales = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState<Sale | null>(null)
  const [viewing, setViewing] = useState<Sale | null>(null)

  const [items, setItems] = useState<Sale[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productLookupError, setProductLookupError] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    const loadMasters = async () => {
      try {
        const [partiesData, suppliersData, productsData] = await Promise.all([
          partyApi.list({ page: 1, limit: 1000 }),
          supplierApi.list(),
          productApi.products.list({ status: true, page: 1, limit: 1000 }),
        ])
        if (!cancelled) {
          setParties(partiesData.party)
          setSuppliers(suppliersData.supplier)
          setProducts(productsData.products)
        }
      } catch {
        if (!cancelled) toast({ title: 'Failed to load master data', variant: 'error' })
      }
    }
    loadMasters()
    return () => { cancelled = true }
  }, [toast])

  useEffect(() => {
    let cancelled = false
    const loadSales = async () => {
      try {
        const data = await saleApi.list({
          search: search || undefined,
          partyId: form.partyId ? Number(form.partyId) : undefined,
          page,
          limit,
        })
        if (!cancelled) {
          setItems(data.sale)
          setTotal(data.total)
        }
      } catch (err) {
        if (!cancelled) toast({ title: 'Failed to load sales', description: (err as Error).message, variant: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadSales()
    return () => { cancelled = true }
  }, [search, form.partyId, page, limit, toast])

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
    setProductLookupError('')
  }

  const openCreate = () => {
    resetForm()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (row: Sale) => {
    setEditing(row)
    setForm({
      productId: String(row.productId ?? ''),
      productCode: row.productCode,
      productName: row.productName,
      partyId: String(row.partyId),
      partyName: row.partyName,
      supplierId: String(row.supplierId ?? ''),
      supplierName: row.supplierName || '',
      supplierMobile: row.supplierMobile || '',
      supplierEmail: row.supplierEmail || '',
      supplierAddress: row.supplierAddress || '',
      sizeId: String(row.sizeId),
      colorId: String(row.colorId),
      sizeName: row.size?.name || `Size #${row.sizeId}`,
      colorName: row.color?.name || `Color #${row.colorId}`,
      quantity: String(row.quantity),
      unit: row.unit || 'PIECES',
      salePrice: String(row.salePrice),
      purchasePrice: String(row.purchasePrice),
      status: row.status,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openView = (row: Sale) => {
    setViewing(row)
  }

  const handlePartyChange = (partyId: string) => {
    setForm((f) => ({ ...f, partyId }))
    const party = parties.find((p) => String(p.id) === partyId)
    if (party) {
      setForm((f) => ({
        ...f,
        partyId: String(party.id),
        partyName: party.partyName,
      }))
    }
  }

  const handleSupplierChange = (supplierId: string) => {
    setForm((f) => ({ ...f, supplierId }))
    const supplier = suppliers.find((s) => String(s.id) === supplierId)
    if (supplier) {
      setForm((f) => ({
        ...f,
        supplierId: String(supplier.id),
        supplierName: supplier.name,
        supplierMobile: supplier.mobile,
        supplierEmail: supplier.email || '',
        supplierAddress: [supplier.address, supplier.city, supplier.state, supplier.country, supplier.pincode].filter(Boolean).join(', '),
      }))
    }
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
        colorId: String(product.colorId),
        sizeName: product.size?.name || `Size #${product.sizeId}`,
        colorName: product.color?.name || `Color #${product.colorId}`,
      }))
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const payload = {
        productName: form.productName,
        productCode: form.productCode,
        partyId: Number(form.partyId),
        partyName: form.partyName || '',
        supplierId: form.supplierId ? Number(form.supplierId) : undefined,
        supplierName: form.supplierName || '',
        supplierMobile: form.supplierMobile || '',
        supplierEmail: form.supplierEmail || '',
        supplierAddress: form.supplierAddress || '',
        sizeId: Number(form.sizeId),
        colorId: Number(form.colorId),
        quantity: Number(form.quantity),
        unit: form.unit,
        salePrice: Number(form.salePrice),
        purchasePrice: Number(form.purchasePrice),
        status: form.status,
      }

      if (editing) {
        await saleApi.update(editing.id, payload)
        toast({ title: 'Sale updated', variant: 'success' })
      } else {
        await saleApi.create(payload)
        toast({ title: 'Sale created', variant: 'success' })
      }
      resetForm()
      setPage(1)
      const data = await saleApi.list({ search: search || undefined, page: 1, limit })
      setItems(data.sale)
      setTotal(data.total)
    } catch (err) {
      toast({ title: editing ? 'Update failed' : 'Creation failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const remove = async (row: Sale) => {
    try {
      await saleApi.remove(row.id)
      toast({ title: 'Sale deleted', variant: 'success' })
      const data = await saleApi.list({ search: search || undefined, page: page > 1 ? page - 1 : 1, limit })
      setItems(data.sale)
      setTotal(data.total)
      setPage(data.page || 1)
    } catch (err) {
      toast({ title: 'Delete failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginatedItems = items.slice((page - 1) * limit, page * limit)

  const columns: DataTableColumn<Sale>[] = [
    { key: 'productCode', header: 'Product Code', width: '120px' },
    { key: 'productName', header: 'Product Name' },
    { key: 'partyName', header: 'Party', cell: (row) => row.partyName || row.party?.partyName || '—' },
    { key: 'supplierName', header: 'Supplier', cell: (row) => row.supplierName || row.supplier?.name || '—' },
    {
      key: 'size',
      header: 'Size',
      cell: (row) => row.size?.name || '—',
    },
    {
      key: 'color',
      header: 'Color',
      cell: (row) => row.color?.name || '—',
    },
    {
      key: 'quantity',
      header: 'Quantity',
      width: '100px',
      cell: (row) => `${row.quantity} pcs`,
    },
    {
      key: 'salePrice',
      header: 'Sale Price',
      width: '120px',
      cell: (row) => `₹${row.salePrice}`,
    },
    {
      key: 'purchasePrice',
      header: 'Purchase Price',
      width: '140px',
      cell: (row) => `₹${row.purchasePrice}`,
    },
    {
      key: 'total',
      header: 'Total',
      width: '120px',
      cell: (row) => `₹${row.total}`,
    },
    {
      key: 'perSaleProfit',
      header: 'Profit',
      width: '120px',
      cell: (row) => `₹${row.perSaleProfit}`,
    },
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

  const actions: DataTableAction<Sale>[] = [
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
            <p className="text-sm font-semibold text-primary-dark">SALES</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">All Sales</h2>
          </div>
        </div>
        <Button onClick={openCreate}>+ Add Sale</Button>
      </div>

      <Card className="mb-6 p-6">
        <form id="sale-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Product Code" required error={productLookupError}>
              <Select required value={form.productId} onChange={(e) => handleProductChange(e.target.value)}>
                <option value="">Select product code</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.productCode}</option>)}
              </Select>
            </FormField>
            <FormField label="Product Name" required><Input required value={form.productName} readOnly placeholder="Auto-filled from product code" /></FormField>
            <FormField label="Party" required>
              <Select required value={form.partyId} onChange={(e) => handlePartyChange(e.target.value)}>
                <option value="">Select party</option>
                {parties.map((p) => <option key={p.id} value={p.id}>{p.partyName}</option>)}
              </Select>
            </FormField>
            <FormField label="Party Name"><Input value={form.partyName} readOnly placeholder="Auto-filled from party" /></FormField>
            <FormField label="Supplier">
              <Select value={form.supplierId} onChange={(e) => handleSupplierChange(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Supplier Name"><Input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} /></FormField>
            <FormField label="Supplier Mobile"><Input value={form.supplierMobile} onChange={(e) => setForm({ ...form, supplierMobile: e.target.value })} /></FormField>
            <FormField label="Supplier Email"><Input type="email" value={form.supplierEmail} onChange={(e) => setForm({ ...form, supplierEmail: e.target.value })} /></FormField>
            <FormField label="Supplier Address" className="sm:col-span-2 lg:col-span-4"><Input value={form.supplierAddress} onChange={(e) => setForm({ ...form, supplierAddress: e.target.value })} /></FormField>
            <FormField label="Size" required><Input required value={form.sizeName} readOnly placeholder="Auto-filled from product code" /></FormField>
            <FormField label="Color" required><Input required value={form.colorName} readOnly placeholder="Auto-filled from product code" /></FormField>
            <FormField label="Quantity" required>
              <div className="flex gap-2">
                <Input required type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="flex-1" />
                <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as UnitType })} className="w-24">
                  <option value="PIECES">Pieces</option>
                  <option value="DOZEN">Dozens</option>
                </Select>
              </div>
            </FormField>
            <FormField label="Sale Price" required><Input required type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} /></FormField>
            <FormField label="Purchase Price" required><Input required type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></FormField>
            <FormField label="Status">
              <Select value={form.status ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value === 'ACTIVE' })}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </FormField>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
            <Button type="submit" loading={loading}>{editing ? 'Update Sale' : 'Submit Sale'}</Button>
          </div>
        </form>
      </Card>

      <Card className="mb-6 p-4">
        <div className="relative max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search by product name or product code"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={paginatedItems}
        rowKey={(row) => row.id}
        actions={actions}
        loading={loading}
        emptyMessage="No sales found."
        pagination={{
          page,
          totalPages,
          total,
          limit,
          onPageChange: setPage,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1) },
        }}
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Sale Details" footer={<Button variant="outline" onClick={() => setViewing(null)}>Close</Button>}>
        {viewing && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border-gold">
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Product Name</td><td className="px-4 py-2 text-secondary">{viewing.productName}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Product Code</td><td className="px-4 py-2 text-secondary">{viewing.productCode}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Party</td><td className="px-4 py-2 text-secondary">{viewing.partyName || viewing.party?.partyName || '—'}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Supplier</td><td className="px-4 py-2 text-secondary">{viewing.supplier?.name || viewing.supplierName || '—'}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Size</td><td className="px-4 py-2 text-secondary">{viewing.size?.name || '—'}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Color</td><td className="px-4 py-2 text-secondary">{viewing.color?.name || '—'}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Quantity</td><td className="px-4 py-2 text-secondary">{viewing.quantity} pcs</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Sale Price</td><td className="px-4 py-2 text-secondary">₹{viewing.salePrice}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Purchase Price</td><td className="px-4 py-2 text-secondary">₹{viewing.purchasePrice}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Total</td><td className="px-4 py-2 text-secondary">₹{viewing.total}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Per Sale Profit</td><td className="px-4 py-2 text-secondary">₹{viewing.perSaleProfit}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Status</td><td className="px-4 py-2 text-secondary">{viewing.status ? 'Active' : 'Inactive'}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  )
}
