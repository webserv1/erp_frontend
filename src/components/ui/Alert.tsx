import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils'

type AlertVariant = 'error' | 'success' | 'info'
interface AlertProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
  variant?: AlertVariant
}

const variants: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-border-gold bg-primary/10 text-secondary',
}

export const Alert = ({ children, className, variant = 'info', ...props }: AlertProps) => (
  <p role="alert" className={cn('rounded-lg border p-3 text-sm', variants[variant], className)} {...props}>
    {children}
  </p>
)
