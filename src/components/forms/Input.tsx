import type { InputHTMLAttributes } from 'react'
import { cn } from '../utils'

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn('input-field', className)} {...props} />
)
