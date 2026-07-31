import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '../ui'
import { cn } from '../utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  cell?: (row: T, index: number) => ReactNode
  sortable?: boolean
  width?: string
  className?: string
}

export interface DataTableAction<T> {
  label: ReactNode | ((row: T) => ReactNode)
  onClick: (row: T) => void
  className?: string | ((row: T) => string)
  title?: string | ((row: T) => string)
  disabled?: boolean | ((row: T) => boolean)
}

export interface DataTablePagination {
  page: number
  totalPages: number
  total: number
  limit: number
  limitOptions?: number[]
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  actions?: DataTableAction<T>[]
  loading?: boolean
  emptyMessage?: string
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  pagination?: DataTablePagination
}

const getCellValue = <T,>(row: T, key: string) => {
  const value = (row as Record<string, unknown>)[key]
  return value === null || value === undefined ? '—' : String(value)
}

export const DataTable = <T,>({
  columns,
  rows,
  rowKey,
  actions,
  loading = false,
  emptyMessage = 'No records found.',
  onSort,
  sortKey,
  sortDirection,
  pagination,
}: DataTableProps<T>) => {
  const columnCount = columns.length + (actions ? 1 : 0)
  const canGoBack = pagination && pagination.page > 1 && pagination.total > 0
  const canGoForward = pagination && pagination.page < pagination.totalPages && pagination.total > 0

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-left text-sm">
          <thead className="border-b border-border-gold bg-primary/10 text-secondary">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wide"
                >
                  <div className="flex items-center gap-1.5">
                    {column.header}
                    {column.sortable && onSort && (
                      <span className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => onSort(column.key, 'asc')}
                          className={cn('rounded text-text-secondary hover:text-primary-dark', sortKey === column.key && sortDirection === 'asc' && 'text-primary-dark')}
                          aria-label={`Sort ${column.header} ascending`}
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSort(column.key, 'desc')}
                          className={cn('rounded text-text-secondary hover:text-primary-dark', sortKey === column.key && sortDirection === 'desc' && 'text-primary-dark')}
                          aria-label={`Sort ${column.header} descending`}
                        >
                          <ChevronDown size={13} />
                        </button>
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-gold">
            {loading ? (
              Array.from({ length: 5 }, (_, rowIndex) => (
                <tr key={rowIndex} className="animate-pulse">
                  {Array.from({ length: columnCount }, (_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <div className="h-4 rounded bg-primary/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-12 text-center text-text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-primary/5">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{ width: column.width }}
                      className={cn('px-4 py-3 text-text-primary', column.className)}
                    >
                      {column.cell ? column.cell(row, index) : getCellValue(row, column.key)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        {actions.map((action, actionIndex) => {
                          const disabled = typeof action.disabled === 'function' ? action.disabled(row) : action.disabled
                          const label = typeof action.label === 'function' ? action.label(row) : action.label
                          const className = typeof action.className === 'function' ? action.className(row) : action.className
                          const title = typeof action.title === 'function' ? action.title(row) : action.title
                          return (
                            <button
                              key={actionIndex}
                              type="button"
                              disabled={disabled}
                              title={title}
                              onClick={() => action.onClick(row)}
                              className={cn('rounded p-1.5 text-primary-dark transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-40', className)}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex flex-col gap-3 border-t border-border-gold bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            Page <span className="font-semibold text-secondary">{pagination.page}</span> of{' '}
            <span className="font-semibold text-secondary">{pagination.totalPages}</span>
            <span className="ml-1">({pagination.total} total)</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              Per page:
              <select
                value={pagination.limit}
                onChange={(event) => pagination.onLimitChange(Number(event.target.value))}
                className="rounded-md border border-border-gold bg-white px-2 py-1 text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {(pagination.limitOptions ?? [10, 25, 50, 100]).map((limit) => (
                  <option key={limit} value={limit}>{limit}</option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={!canGoBack}
                className="rounded-lg border border-border-gold bg-white px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={!canGoForward}
                className="rounded-lg border border-border-gold bg-white px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
