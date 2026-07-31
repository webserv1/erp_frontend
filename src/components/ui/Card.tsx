import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils'

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  hoverable?: boolean
}

export const Card = ({ children, className, hoverable = false, ...props }: CardProps) => (
  <section
    className={cn(
      'rounded-xl border border-border-gold bg-card shadow-sm',
      hoverable && 'transition-shadow hover:shadow-lg',
      className,
    )}
    {...props}
  >
    {children}
  </section>
)
