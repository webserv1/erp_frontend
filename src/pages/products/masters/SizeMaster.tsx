import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/ui'
import { Button } from '../../../components/ui'
import { productApi } from '../../../services/product.api'
import type { Size } from '../../../types/product.types'
import { DataTable, type DataTableColumn, type DataTableAction } from '../../../components/table'
import { Modal } from '../../../components/ui'
import { FormField, Input, Select } from '../../../components/forms'

export const SizeMaster = () => {
  const [items, setItems] = useState<Size[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Size | null>(null)
  const [form, setForm] = useState({ name: '', status: 'ACTIVE' })
  const { toast } = useToast()
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productApi.sizes.list()
      setItems(data)
    } catch (err) {
      toast({ title: 'Failed to load sizes', description: (err as Error).message, variant: 'error' })
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

  const openEdit = (row: Size) => {
    setEditing(row)
    setForm({ name: row.name, status: row.status })
    setOpen(true)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      if (editing) {
        await productApi.sizes.update(editing.id, form)
        toast({ title: 'Size updated', variant: 'success' })
      } else {
        await productApi.sizes.create(form)
        toast({ title: 'Size created', variant: 'success' })
      }
      setOpen(false)
      load()
    } catch (err) {
      toast({ title: editing ? 'Update failed' : 'Creation failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const remove = async (row: Size) => {
    try {
      await productApi.sizes.remove(row.id)
      toast({ title: 'Size deleted', variant: 'success', description: `Size "${row.name}" has been deleted.` })
      load()
    } catch (err) {
      toast({ title: 'Delete failed', description: (err as Error).message, variant: 'error' })
    }
  }

  const columns: DataTableColumn<Size>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Size Name' },
    { key: 'status', header: 'Status' },
  ]

  const actions: DataTableAction<Size>[] = [
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
            <h2 className="mt-1 text-2xl font-bold text-secondary">Size Master</h2>
          </div>
        </div>
        <Button onClick={openCreate}>+ Add Size</Button>
      </div>
      <DataTable columns={columns} rows={items} rowKey={(row) => row.id} actions={actions} loading={loading} emptyMessage="No sizes found." />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Size' : 'Add Size'} footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="size-form">Save</Button></>}>
        <form id="size-form" onSubmit={submit} className="space-y-4">
          <FormField label="Size Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
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
