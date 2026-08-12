import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Check, ChevronDown, Plus, X } from 'lucide-react'
import { cn } from '../utils'
import { Button } from '../ui'

interface MultiSelectOption {
  id: number | string
  name: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: (number | string)[]
  onChange: (value: (number | string)[]) => void
  onAddNew?: (name: string) => void | Promise<void>
  placeholder?: string
  label?: string
  disabled?: boolean
  error?: string
}

export const MultiSelect = ({ options, value, onChange, onAddNew, placeholder = 'Select...', label, disabled, error }: MultiSelectProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newItem, setNewItem] = useState('')
  const [adding, setAdding] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOptions = options.filter((opt) => value.includes(opt.id))
  const filteredOptions = options.filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()) && !value.includes(opt.id))

  const toggle = (id: number | string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const handleAddNew = async () => {
    if (!newItem.trim() || !onAddNew) return
    try {
      setAdding(true)
      await onAddNew(newItem.trim())
      setNewItem('')
    } finally {
      setAdding(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddNew()
    }
  }

  return (
    <div className={cn('relative', disabled && 'opacity-50 pointer-events-none')} ref={containerRef}>
      {label && <span className="field-label mb-1.5 block text-sm font-medium text-secondary">{label}</span>}
      <button
        type="button"
        onClick={() => { setOpen(!open); inputRef.current?.focus() }}
        className={cn('input-field flex min-h-10 w-full items-center justify-between gap-2 text-left', !selectedOptions.length && 'text-text-secondary')}
      >
        <span className="flex flex-wrap gap-1.5">
          {selectedOptions.length === 0 ? (
            <span>{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span key={opt.id} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-dark">
                {opt.name}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(opt.id) }}
                  className="rounded-full hover:bg-primary/20"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </span>
        <ChevronDown size={16} className="shrink-0 text-text-secondary" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-border-gold bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 && !onAddNew && (
              <p className="px-3 py-2 text-xs text-text-secondary">No options found.</p>
            )}
            {filteredOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5"
              >
                <span className={cn('flex size-4 items-center justify-center rounded border border-border-gold', value.includes(opt.id) && 'border-primary bg-primary text-white')}>
                  {value.includes(opt.id) && <Check size={12} />}
                </span>
                <span className="text-secondary">{opt.name}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-border-gold p-2">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="input-field flex-1 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {onAddNew && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add new..."
                  className="input-field flex-1 text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddNew} loading={adding} disabled={!newItem.trim()}>
                  <Plus size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
