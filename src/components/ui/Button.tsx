import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils'

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'default' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
  outline: 'border border-primary bg-white text-primary hover:bg-primary hover:text-white focus:ring-primary',
  ghost: 'text-secondary hover:bg-primary/10 focus:ring-primary',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
}

export const Button = ({
  children,
  className,
  disabled,
  loading = false,
  type = 'button',
  variant = 'primary',
  size = 'default',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cn(
      'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
      size === 'icon' ? 'w-10 p-2.5' : 'px-4 py-2.5',
      variants[variant],
      className,
    )}
    {...props}
  >
    {loading && (
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      />
    )}
    {children}
  </button>
)
