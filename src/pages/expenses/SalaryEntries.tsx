import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Modal, useToast } from '../../components/ui'
import { FormField, Input, Textarea } from '../../components/forms'
import { DataTable, type DataTableAction, type DataTableColumn } from '../../components/table'
import { expenseApi } from '../../services/expense.api'
import type { SalaryEntry, SalaryEntrySummary } from '../../types/product.types'

type FormState = {
  sqAmount: string
  arsAmount: string
  workerAmount: string
  entryDate: string
  notes: string
}

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const emptyForm = (): FormState => ({
  sqAmount: '',
  arsAmount: '',
  workerAmount: '',
  entryDate: getTodayDate(),
  notes: '',
})

export const SalaryEntries = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState<SalaryEntry | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SalaryEntry | null>(null)
  const [items, setItems] = useState<SalaryEntry[]>([])
  const [summary, setSummary] = useState<SalaryEntrySummary>({
    totalSqAmount: 0,
    totalArsAmount: 0,
    totalWorkerAmount: 0,
    totalSalaryAmount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await expenseApi.listSalaryEntries()
      setItems(data.salaryEntries)
      setSummary(data.summary)
    } catch (err) {
      toast({
        title: 'Failed to load salary entries',
        description: (err as Error).message,
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const resetForm = () => {
    setEditing(null)
    setForm(emptyForm())
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = {
        sqAmount: Number(form.sqAmount || 0),
        arsAmount: Number(form.arsAmount || 0),
        workerAmount: Number(form.workerAmount || 0),
        entryDate: form.entryDate,
        notes: form.notes.trim() || undefined,
      }

      if (editing) {
        await expenseApi.updateSalaryEntry(editing.id, payload)
        toast({ title: 'Salary entry updated', variant: 'success' })
      } else {
        await expenseApi.createSalaryEntry(payload)
        toast({ title: 'Salary entry added', variant: 'success' })
      }
      resetForm()
      await loadData()
    } catch (err) {
      toast({
        title: editing ? 'Update failed' : 'Creation failed',
        description: (err as Error).message,
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (row: SalaryEntry) => {
    setEditing(row)
    setForm({
      sqAmount: String(row.sqAmount),
      arsAmount: String(row.arsAmount),
      workerAmount: String(row.workerAmount),
      entryDate: row.entryDate.slice(0, 10),
      notes: row.notes || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onDelete = async () => {
    if (!pendingDelete) return
    try {
      await expenseApi.deleteSalaryEntry(pendingDelete.id)
      toast({ title: 'Salary entry deleted', variant: 'success' })
      setPendingDelete(null)
      await loadData()
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: (err as Error).message,
        variant: 'error',
      })
    }
  }

  const columns = useMemo<DataTableColumn<SalaryEntry>[]>(
    () => [
      {
        key: 'entryDate',
        header: 'Date',
        width: '140px',
        cell: (row) => new Date(row.entryDate).toLocaleDateString('en-IN'),
      },
      {
        key: 'sqAmount',
        header: 'SQ Salary',
        width: '140px',
        cell: (row) => `₹${row.sqAmount.toLocaleString('en-IN')}`,
      },
      {
        key: 'arsAmount',
        header: 'ARS Salary',
        width: '140px',
        cell: (row) => `₹${row.arsAmount.toLocaleString('en-IN')}`,
      },
      {
        key: 'workerAmount',
        header: 'Worker Salary',
        width: '140px',
        cell: (row) => `₹${row.workerAmount.toLocaleString('en-IN')}`,
      },
      {
        key: 'notes',
        header: 'Notes',
        cell: (row) => row.notes || '-',
      },
    ],
    [],
  )

  const actions = useMemo<DataTableAction<SalaryEntry>[]>(
    () => [
      { label: <Pencil size={16} />, onClick: onEdit, title: 'Edit' },
      {
        label: <Trash2 size={16} />,
        onClick: setPendingDelete,
        className: 'text-red-600 hover:bg-red-50',
        title: 'Delete',
      },
    ],
    [],
  )

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/expenses')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <p className="text-sm font-semibold text-primary-dark">SALARY ENTRIES</p>
            <h2 className="mt-1 text-2xl font-bold text-secondary">SQ / ARS / Worker Salary Ledger</h2>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-text-secondary">SQ Total</p>
          <p className="mt-1 text-2xl font-bold text-secondary">₹{summary.totalSqAmount.toLocaleString('en-IN')}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-text-secondary">ARS Total</p>
          <p className="mt-1 text-2xl font-bold text-secondary">₹{summary.totalArsAmount.toLocaleString('en-IN')}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-text-secondary">Worker Total</p>
          <p className="mt-1 text-2xl font-bold text-secondary">₹{summary.totalWorkerAmount.toLocaleString('en-IN')}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-text-secondary">Overall Salary Total</p>
          <p className="mt-1 text-2xl font-bold text-secondary">₹{summary.totalSalaryAmount.toLocaleString('en-IN')}</p>
        </Card>
      </div>

      <Card className="mb-6 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="SQ Salary">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.sqAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, sqAmount: e.target.value }))}
              />
            </FormField>
            <FormField label="ARS Salary">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.arsAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, arsAmount: e.target.value }))}
              />
            </FormField>
            <FormField label="Worker Salary">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.workerAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, workerAmount: e.target.value }))}
              />
            </FormField>
            <FormField label="Date" required>
              <Input
                type="date"
                value={form.entryDate}
                onChange={(e) => setForm((prev) => ({ ...prev, entryDate: e.target.value }))}
                required
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes"
            />
          </FormField>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>
              {editing ? 'Update Entry' : 'Add Entry'}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
          </div>
        </form>
      </Card>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        loading={loading}
        actions={actions}
        emptyMessage="No salary entries found."
      />

      <Modal open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} title="Confirm Delete">
        <p className="text-sm text-text-secondary">Are you sure you want to delete this salary entry?</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={onDelete}>
            <Trash2 size={16} className="mr-1" />
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}
