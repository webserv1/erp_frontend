import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../utils'

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn('input-field min-h-28 resize-y', className)} {...props} />
)
