import type { ReactNode } from 'react'
import { cn } from '../utils'

interface FormFieldProps {
  label: string
  children: ReactNode
  icon?: ReactNode
  required?: boolean
  error?: string
  hint?: string
  className?: string
}

export const FormField = ({
  label,
  children,
  icon,
  required,
  error,
  hint,
  className,
}: FormFieldProps) => (
  <label className={cn('block', className)}>
    <span className="field-label flex items-center gap-2">
      {icon}
      {label}
      {required && <span className="text-red-600">*</span>}
    </span>
    {children}
    {error ? (
      <span className="mt-1 block text-xs text-red-600">{error}</span>
    ) : hint ? (
      <span className="mt-1 block text-xs text-text-secondary">{hint}</span>
    ) : null}
  </label>
)
