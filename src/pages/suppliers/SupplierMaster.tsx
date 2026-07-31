import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Eye, Pencil, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast, Button, Card, Modal } from '../../components/ui'
import { FormField, Input, Select } from '../../components/forms'
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/table'
import { supplierApi } from '../../services/supplier.api'
import type { Supplier } from '../../types/product.types'

type FormState = {
  name: string
  mobile: string
  email: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  status: boolean
}

const emptyForm: FormState = {
  name: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  status: true,
}

export const SupplierMaster = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [viewing, setViewing] = useState<Supplier | null>(null)

  const [items, setItems] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    const loadSuppliers = async () => {
      try {
        const data = await supplierApi.list({
          search: search || undefined,
          status: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined,
          page,
          limit,
        })
        if (!cancelled) {
          setItems(data.supplier)
          setTotal(data.total)
        }
      } catch (err) {
        if (!cancelled) toast({ title: 'Failed to load suppliers', description: (err as Error).message, variant: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadSuppliers()
    return () => { cancelled = true }
  }, [search, statusFilter, page, limit, toast])

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
  }

  const openCreate = () => {
    resetForm()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (row: Supplier) => {
    setEditing(row)
    setForm({
      name: row.name,
      mobile: row.mobile,
      email: row.email || '',
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      pincode: row.pincode,
      status: row.status,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openView = (row: Supplier) => {
    setViewing(row)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const payload = {
        name: form.name,
        mobile: form.mobile,
        email: form.email || undefined,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        pincode: form.pincode,
        status: form.status,
      }

      if (editing) {
        await supplierApi.update(editing.id, payload)
        toast({ title: 'Supplier updated', variant: 'success' })
      } else {
        await supplierApi.create(payload)
        toast({ title: 'Supplier created', variant: 'success' })
      }
      resetForm()
      setPage(1)
    } catch (err) {
      toast({ title: editing ? 'Update failed' : 'Creation failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const remove = async (row: Supplier) => {
    try {
      await supplierApi.remove(row.id)
      toast({ title: 'Supplier deleted', variant: 'success' })
      setPage((p) => Math.max(1, p - 1))
    } catch (err) {
      toast({ title: 'Delete failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginatedItems = items.slice((page - 1) * limit, page * limit)

  const columns: DataTableColumn<Supplier>[] = [
    { key: 'name', header: 'Supplier Name' },
    { key: 'mobile', header: 'Mobile', width: '140px' },
    { key: 'email', header: 'Email' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
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

  const actions: DataTableAction<Supplier>[] = [
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
            <p className="text-sm font-semibold text-primary-dark">SUPPLIER MASTER</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">All Suppliers</h2>
          </div>
        </div>
        <Button onClick={openCreate}>+ Add Supplier</Button>
      </div>

      <Card className="mb-6 p-6">
        <form id="supplier-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Supplier Name" required><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
            <FormField label="Mobile" required><Input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="7-15 digits" /></FormField>
            <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
            <FormField label="Address" required><Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></FormField>
            <FormField label="City" required><Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></FormField>
            <FormField label="State" required><Input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></FormField>
            <FormField label="Country" required><Input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></FormField>
            <FormField label="Pincode" required><Input required value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></FormField>
            <FormField label="Status">
              <Select value={form.status ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value === 'ACTIVE' })}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </FormField>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
            <Button type="submit" loading={loading}>{editing ? 'Update Supplier' : 'Submit Supplier'}</Button>
          </div>
        </form>
      </Card>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Search by supplier name or mobile"
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
        emptyMessage="No suppliers found."
        pagination={{
          page,
          totalPages,
          total,
          limit,
          onPageChange: setPage,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1) },
        }}
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Supplier Details" footer={<Button variant="outline" onClick={() => setViewing(null)}>Close</Button>}>
        {viewing && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border-gold">
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Name</td><td className="px-4 py-2 text-secondary">{viewing.name}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Mobile</td><td className="px-4 py-2 text-secondary">{viewing.mobile}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Email</td><td className="px-4 py-2 text-secondary">{viewing.email || '—'}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Address</td><td className="px-4 py-2 text-secondary">{viewing.address}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">City</td><td className="px-4 py-2 text-secondary">{viewing.city}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">State</td><td className="px-4 py-2 text-secondary">{viewing.state}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Country</td><td className="px-4 py-2 text-secondary">{viewing.country}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Pincode</td><td className="px-4 py-2 text-secondary">{viewing.pincode}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Status</td><td className="px-4 py-2 text-secondary">{viewing.status ? 'Active' : 'Inactive'}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  )
}
