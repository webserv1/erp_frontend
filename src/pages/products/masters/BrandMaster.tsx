import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/ui'
import { Button } from '../../../components/ui'
import { productApi } from '../../../services/product.api'
import type { Brand } from '../../../types/product.types'
import { DataTable, type DataTableColumn, type DataTableAction } from '../../../components/table'
import { Modal } from '../../../components/ui'
import { FormField, Input, Select } from '../../../components/forms'

export const BrandMaster = () => {
  const [items, setItems] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [form, setForm] = useState({ name: '', status: 'ACTIVE' })
  const { toast } = useToast()
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productApi.brands.list()
      setItems(data)
    } catch (err) {
      toast({ title: 'Failed to load brands', description: (err as Error).message, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', status: 'ACTIVE' })
    setOpen(true)
  }

  const openEdit = (row: Brand) => {
    setEditing(row)
    setForm({ name: row.name, status: row.status })
    setOpen(true)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      if (editing) {
        await productApi.brands.update(editing.id, form)
        toast({ title: 'Brand updated', variant: 'success' })
      } else {
        await productApi.brands.create(form)
        toast({ title: 'Brand created', variant: 'success' })
      }
      setOpen(false)
      load()
    } catch (err) {
      toast({ title: editing ? 'Update failed' : 'Creation failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const remove = async (row: Brand) => {
    try {
      await productApi.brands.remove(row.id)
      toast({ title: 'Brand deleted', variant: 'success', description: `Brand "${row.name}" has been deleted.` })
      load()
    } catch (err) {
      toast({ title: 'Delete failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const columns: DataTableColumn<Brand>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Brand Name' },
    { key: 'status', header: 'Status' },
  ]

  const actions: DataTableAction<Brand>[] = [
    { label: 'Edit', onClick: openEdit },
    { label: 'Delete', onClick: remove, className: 'text-red-600 hover:bg-red-50' },
  ]

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/product-masters')}><ArrowLeft size={18} /></Button>
          <div>
            <p className="text-sm font-semibold text-primary-dark">PRODUCT MASTERS</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">Brand Master</h2>
          </div>
        </div>
        <Button onClick={openCreate}>+ Add Brand</Button>
      </div>
      <DataTable columns={columns} rows={items} rowKey={(row) => row.id} actions={actions} loading={loading} emptyMessage="No brands found." />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Brand' : 'Add Brand'} footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="brand-form">Save</Button></>}>
        <form id="brand-form" onSubmit={submit} className="space-y-4">
          <FormField label="Brand Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </FormField>
        </form>
      </Modal>
    </>
  )
}
