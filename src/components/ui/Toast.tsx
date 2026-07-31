import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import { cn } from '../utils'

type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const toastStyles: Record<ToastVariant, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  error: { icon: CircleAlert, className: 'border-red-200 bg-red-50 text-red-800' },
  info: { icon: Info, className: 'border-border-gold bg-card text-secondary' },
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(({ title, description, variant = 'info' }: ToastOptions) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, title, description, variant }])
    window.setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-100 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map(({ id, title, description, variant }) => {
          const { icon: Icon, className } = toastStyles[variant]
          return (
            <div key={id} role="status" className={cn('pointer-events-auto flex gap-3 rounded-xl border p-4 shadow-lg', className)}>
              <Icon size={20} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1"><p className="font-semibold">{title}</p>{description && <p className="mt-1 text-sm opacity-80">{description}</p>}</div>
              <button type="button" onClick={() => dismiss(id)} className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100" aria-label="Dismiss notification"><X size={18} /></button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider.')
  return context
}
