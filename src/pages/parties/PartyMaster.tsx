import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Eye, Pencil, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast, Button, Card, Modal } from '../../components/ui'
import { FormField, Input, Select } from '../../components/forms'
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/table'
import { partyApi } from '../../services/party.api'
import type { Party } from '../../types/product.types'
import { useAuth } from '../../hooks/useAuth'

type FormState = {
  partyName: string
  shopName: string
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
  partyName: '',
  shopName: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  status: true,
}

export const PartyMaster = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role.name === 'ADMIN'

  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState<Party | null>(null)
  const [viewing, setViewing] = useState<Party | null>(null)

  const [items, setItems] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const loadParties = async () => {
      try {
        const data = await partyApi.list({
          search: search || undefined,
          status: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined,
          page,
          limit,
        })
        if (!cancelled) {
          setItems(data.party)
          setTotal(data.total)
        }
      } catch (err) {
        if (!cancelled) toast({ title: 'Failed to load parties', description: (err as Error).message, variant: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadParties()
    return () => { cancelled = true }
  }, [search, statusFilter, page, limit, refreshKey, toast])

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
  }

  const openCreate = () => {
    resetForm()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (row: Party) => {
    setEditing(row)
    setForm({
      partyName: row.partyName,
      shopName: row.shopName,
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

  const openView = (row: Party) => {
    setViewing(row)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const payload = {
        partyName: form.partyName,
        shopName: form.shopName,
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
        await partyApi.update(editing.id, payload)
        toast({ title: 'Party updated', variant: 'success' })
      } else {
        await partyApi.create(payload)
        toast({ title: 'Party created', variant: 'success' })
      }
      resetForm()
      setPage(1)
      setRefreshKey((key) => key + 1)
    } catch (err) {
      toast({ title: editing ? 'Update failed' : 'Creation failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const remove = async (row: Party) => {
    try {
      await partyApi.remove(row.id)
      toast({ title: 'Party deleted', variant: 'success' })
      setPage((p) => Math.max(1, p - 1))
      setRefreshKey((key) => key + 1)
    } catch (err) {
      toast({ title: 'Delete failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginatedItems = items.slice((page - 1) * limit, page * limit)

  const columns: DataTableColumn<Party>[] = [
    { key: 'partyName', header: 'Party Name' },
    { key: 'shopName', header: 'Shop Name' },
    { key: 'mobile', header: 'Mobile', width: '140px' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    {
      key: 'sales_profit',
      header: 'Party Profit',
      width: '140px',
      cell: (row) => `₹${row.sales_profit}`,
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

  const actions: DataTableAction<Party>[] = [
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
            <p className="text-sm font-semibold text-primary-dark">PARTY MASTER</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">All Parties</h2>
          </div>
        </div>
        <Button onClick={openCreate}>+ Add Party</Button>
      </div>

      <Card className="mb-6 p-6">
        <form id="party-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Party Name" required><Input required value={form.partyName} onChange={(e) => setForm({ ...form, partyName: e.target.value })} /></FormField>
            <FormField label="Shop Name" required><Input required value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} /></FormField>
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
            <Button type="submit" loading={loading}>{editing ? 'Update Party' : 'Submit Party'}</Button>
          </div>
        </form>
      </Card>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Search by party name, shop name, or mobile"
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
        columns={isAdmin ? columns : columns.filter((column) => column.key !== 'sales_profit')}
        rows={paginatedItems}
        rowKey={(row) => row.id}
        actions={actions}
        loading={loading}
        emptyMessage="No parties found."
        pagination={{
          page,
          totalPages,
          total,
          limit,
          onPageChange: setPage,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1) },
        }}
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Party Details" footer={<Button variant="outline" onClick={() => setViewing(null)}>Close</Button>}>
        {viewing && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border-gold">
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Party Name</td><td className="px-4 py-2 text-secondary">{viewing.partyName}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Shop Name</td><td className="px-4 py-2 text-secondary">{viewing.shopName}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Mobile</td><td className="px-4 py-2 text-secondary">{viewing.mobile}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Email</td><td className="px-4 py-2 text-secondary">{viewing.email || '—'}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Address</td><td className="px-4 py-2 text-secondary">{viewing.address}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">City</td><td className="px-4 py-2 text-secondary">{viewing.city}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">State</td><td className="px-4 py-2 text-secondary">{viewing.state}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Country</td><td className="px-4 py-2 text-secondary">{viewing.country}</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Pincode</td><td className="px-4 py-2 text-secondary">{viewing.pincode}</td></tr>
                {isAdmin && <tr><td className="px-4 py-2 font-semibold text-text-secondary">Party Profit</td><td className="px-4 py-2 text-secondary">{viewing.sales_profit}</td></tr>}
                <tr><td className="px-4 py-2 font-semibold text-text-secondary">Status</td><td className="px-4 py-2 text-secondary">{viewing.status ? 'Active' : 'Inactive'}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  )
}
