import type { InputHTMLAttributes } from 'react'
import { cn } from '../utils'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Checkbox = ({ className, label, id, ...props }: CheckboxProps) => (
  <label className={cn('inline-flex items-center gap-2 text-sm text-secondary cursor-pointer', className)} htmlFor={id}>
    <input
      id={id}
      type="checkbox"
      className={cn('size-4 rounded border-border-gold text-primary focus:ring-primary', props.disabled && 'opacity-50 cursor-not-allowed')}
      {...props}
    />
    {label && <span>{label}</span>}
  </label>
)
