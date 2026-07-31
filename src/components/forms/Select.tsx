import type { SelectHTMLAttributes } from 'react'
import { cn } from '../utils'

export const Select = ({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn('input-field', className)} {...props}>
    {children}
  </select>
)
